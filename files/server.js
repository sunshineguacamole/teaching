/**
 * 教授个人网站 - 后端API示例
 * 
 * 技术栈：Node.js + Express + MySQL
 * 功能：课程管理相关API
 */

const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// 数据库连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'professor_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '2h';

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// ============================================
// 认证中间件
// ============================================

/**
 * JWT Token 验证中间件
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未提供认证令牌'
      }
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无效的认证令牌'
        }
      });
    }
    req.user = user;
    next();
  });
};

/**
 * 管理员权限验证中间件
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '需要管理员权限'
      }
    });
  }
  next();
};

// ============================================
// 认证相关API
// ============================================

/**
 * POST /api/v1/auth/login
 * 用户登录
 */
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '邮箱和密码不能为空'
        }
      });
    }

    // 查询用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误'
        }
      });
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '邮箱或密码错误'
        }
      });
    }

    // 生成JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // 更新最后登录时间
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '登录失败，请稍后重试'
      }
    });
  }
});

/**
 * POST /api/v1/auth/register
 * 用户注册（学生）
 */
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name, studentId } = req.body;

    // 验证输入
    if (!email || !password || !name || !studentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '所有字段都是必填的'
        }
      });
    }

    // 检查邮箱是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: '该邮箱已被注册'
        }
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const userId = generateUUID();
    await pool.execute(
      'INSERT INTO users (id, email, password_hash, name, student_id, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, passwordHash, name, studentId, 'student']
    );

    res.status(201).json({
      success: true,
      message: '注册成功'
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '注册失败，请稍后重试'
      }
    });
  }
});

// ============================================
// 课程相关API
// ============================================

/**
 * GET /api/v1/courses
 * 获取课程列表
 * 查询参数：semester, level, status
 */
app.get('/api/v1/courses', async (req, res) => {
  try {
    const { semester, level, status } = req.query;

    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }

    if (level && level !== 'all') {
      query += ' AND level = ?';
      params.push(level);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [courses] = await pool.execute(query, params);

    // 获取每门课程的资料和作业数量
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const [materials] = await pool.execute(
          'SELECT COUNT(*) as count FROM course_materials WHERE course_id = ?',
          [course.id]
        );
        
        const [assignments] = await pool.execute(
          'SELECT COUNT(*) as count FROM assignments WHERE course_id = ?',
          [course.id]
        );

        return {
          ...course,
          materialCount: materials[0].count,
          assignmentCount: assignments[0].count
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: coursesWithStats,
        total: coursesWithStats.length
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '获取课程列表失败'
      }
    });
  }
});

/**
 * GET /api/v1/courses/:id
 * 获取课程详情
 */
app.get('/api/v1/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await pool.execute(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '课程不存在'
        }
      });
    }

    const course = courses[0];

    // 获取课程章节
    const [chapters] = await pool.execute(
      'SELECT * FROM course_chapters WHERE course_id = ? ORDER BY `order`',
      [id]
    );

    // 获取课程资料
    const [materials] = await pool.execute(
      'SELECT * FROM course_materials WHERE course_id = ? ORDER BY uploaded_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...course,
        chapters,
        materials
      }
    });

  } catch (error) {
    console.error('Get course detail error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '获取课程详情失败'
      }
    });
  }
});

/**
 * POST /api/v1/courses
 * 创建新课程（需要管理员权限）
 */
app.post('/api/v1/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, code, semester, level, description, syllabus } = req.body;

    // 验证输入
    if (!title || !code || !semester || !level) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少必填字段'
        }
      });
    }

    // 检查课程编号是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM courses WHERE code = ? AND semester = ?',
      [code, semester]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_COURSE',
          message: '该学期已存在相同编号的课程'
        }
      });
    }

    // 创建课程
    const courseId = generateUUID();
    await pool.execute(
      'INSERT INTO courses (id, title, code, semester, level, description, syllabus, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [courseId, title, code, semester, level, description, syllabus, 'active']
    );

    const [newCourse] = await pool.execute(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    res.status(201).json({
      success: true,
      data: newCourse[0]
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '创建课程失败'
      }
    });
  }
});

/**
 * PUT /api/v1/courses/:id
 * 更新课程信息（需要管理员权限）
 */
app.put('/api/v1/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, syllabus, status } = req.body;

    const [result] = await pool.execute(
      'UPDATE courses SET title = ?, description = ?, syllabus = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [title, description, syllabus, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '课程不存在'
        }
      });
    }

    const [updatedCourse] = await pool.execute(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedCourse[0]
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '更新课程失败'
      }
    });
  }
});

// ============================================
// 资料相关API
// ============================================

/**
 * GET /api/v1/courses/:courseId/materials
 * 获取课程资料列表
 */
app.get('/api/v1/courses/:courseId/materials', async (req, res) => {
  try {
    const { courseId } = req.params;

    const [materials] = await pool.execute(
      'SELECT * FROM course_materials WHERE course_id = ? ORDER BY uploaded_at DESC',
      [courseId]
    );

    res.json({
      success: true,
      data: {
        materials
      }
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '获取资料列表失败'
      }
    });
  }
});

/**
 * POST /api/v1/materials/upload
 * 上传课程资料（需要管理员权限）
 */
app.post('/api/v1/materials/upload', 
  authenticateToken, 
  requireAdmin, 
  upload.single('file'), 
  async (req, res) => {
    try {
      const { courseId, chapterId, title, type } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: '未上传文件'
          }
        });
      }

      // 保存文件信息到数据库
      const materialId = generateUUID();
      await pool.execute(
        'INSERT INTO course_materials (id, course_id, chapter_id, title, type, file_url, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [materialId, courseId, chapterId || null, title, type, file.path, file.size]
      );

      res.status(201).json({
        success: true,
        data: {
          id: materialId,
          fileUrl: file.path
        }
      });

    } catch (error) {
      console.error('Upload material error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '上传失败'
        }
      });
    }
});

// ============================================
// 作业相关API
// ============================================

/**
 * GET /api/v1/courses/:courseId/assignments
 * 获取课程作业列表
 */
app.get('/api/v1/courses/:courseId/assignments', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const [assignments] = await pool.execute(
      'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date ASC',
      [courseId]
    );

    // 如果是学生，检查提交状态
    if (req.user.role === 'student') {
      const assignmentsWithStatus = await Promise.all(
        assignments.map(async (assignment) => {
          const [submissions] = await pool.execute(
            'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
            [assignment.id, userId]
          );

          return {
            ...assignment,
            submitted: submissions.length > 0,
            submission: submissions[0] || null
          };
        })
      );

      return res.json({
        success: true,
        data: {
          assignments: assignmentsWithStatus
        }
      });
    }

    res.json({
      success: true,
      data: {
        assignments
      }
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '获取作业列表失败'
      }
    });
  }
});

/**
 * POST /api/v1/assignments/:id/submit
 * 提交作业
 */
app.post('/api/v1/assignments/:id/submit',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: '未上传文件'
          }
        });
      }

      // 检查作业是否存在
      const [assignments] = await pool.execute(
        'SELECT * FROM assignments WHERE id = ?',
        [id]
      );

      if (assignments.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '作业不存在'
          }
        });
      }

      const assignment = assignments[0];

      // 检查是否过期
      const isLate = new Date() > new Date(assignment.due_date);

      // 检查是否已提交
      const [existing] = await pool.execute(
        'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
        [id, userId]
      );

      if (existing.length > 0) {
        // 更新提交
        await pool.execute(
          'UPDATE submissions SET file_url = ?, submit_time = NOW(), status = ? WHERE id = ?',
          [file.path, isLate ? 'late' : 'submitted', existing[0].id]
        );

        return res.json({
          success: true,
          message: '重新提交成功',
          data: {
            submissionId: existing[0].id
          }
        });
      }

      // 创建新提交
      const submissionId = generateUUID();
      await pool.execute(
        'INSERT INTO submissions (id, assignment_id, student_id, file_url, status) VALUES (?, ?, ?, ?, ?)',
        [submissionId, id, userId, file.path, isLate ? 'late' : 'submitted']
      );

      res.status(201).json({
        success: true,
        message: '提交成功',
        data: {
          submissionId
        }
      });

    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '提交失败'
        }
      });
    }
});

// ============================================
// 工具函数
// ============================================

/**
 * 生成UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// 错误处理
// ============================================

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '接口不存在'
    }
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message || '服务器错误'
    }
  });
});

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
