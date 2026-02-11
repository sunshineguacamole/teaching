# 教授个人学术网站 - 项目交付文档

## 📦 项目概述

本项目为计算机软件工程专业教授设计的个人学术网站，主要面向学生（本科生、研究生），重点展示课程资料和学生指导信息。采用现代化的技术栈，提供动态网站功能和完善的后台管理系统。

## 📂 文件结构

```
professor-website/
├── README.md                      # 本文件 - 项目说明
│
├── docs/                          # 文档目录
│   └── 技术开发文档.md             # 完整的技术开发文档
│
├── prototype/                     # 原型设计
│   └── 网站原型设计.html           # 交互式原型（可在浏览器中打开）
│
└── demo/                          # 示例代码
    ├── frontend/                  # 前端示例
    │   ├── CourseManagement.jsx   # React 课程管理组件
    │   └── CourseManagement.css   # 配套样式文件
    │
    └── backend/                   # 后端示例
        └── server.js              # Node.js API 服务器
```

## 🎯 项目特点

### 核心功能
- ✅ **课程管理系统** - 完整的课程创建、编辑、归档功能
- ✅ **资源中心** - 课件、代码、工具等教学资源管理
- ✅ **作业系统** - 在线提交、批改、反馈
- ✅ **学生管理** - 在读学生展示、毕业去向统计
- ✅ **通知公告** - 课程通知、重要信息发布
- ✅ **后台管理** - 强大的内容管理后台

### 技术亮点
- 🚀 **现代化技术栈** - React 18 + Node.js + MySQL
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔒 **安全可靠** - JWT认证、权限控制、数据加密
- ⚡ **性能优化** - 代码分割、懒加载、缓存策略
- 🎨 **精美UI** - 现代化的界面设计，优秀的用户体验

## 📖 使用指南

### 1. 查看原型设计

打开 `prototype/网站原型设计.html` 文件（直接在浏览器中打开即可）：

```bash
# 使用浏览器打开
open prototype/网站原型设计.html

# 或者双击文件用默认浏览器打开
```

原型包含以下页面：
- **首页** - 概览和最新动态
- **课程中心** - 课程列表和筛选
- **课程详情** - 详细的课程信息
- **资源中心** - 教学资源下载
- **学生指导** - 学生信息和招生
- **后台管理** - 管理员操作界面

**提示**：点击顶部导航按钮可以切换不同页面查看。

### 2. 阅读技术文档

`docs/技术开发文档.md` 包含：
- 系统架构设计
- 技术栈选型说明
- 完整的数据库设计
- RESTful API 接口文档
- 安全性设计方案
- 部署和运维指南
- 开发规范和测试计划

### 3. 运行示例代码

#### 前端示例（React）

```bash
# 1. 创建React项目（如果还没有）
npx create-react-app professor-website-frontend
cd professor-website-frontend

# 2. 安装依赖
npm install

# 3. 复制示例文件到 src 目录
cp ../professor-website/demo/frontend/CourseManagement.jsx src/
cp ../professor-website/demo/frontend/CourseManagement.css src/

# 4. 在 App.js 中引入组件
# import CourseManagement from './CourseManagement';
# function App() {
#   return <CourseManagement />;
# }

# 5. 启动开发服务器
npm start
```

#### 后端示例（Node.js）

```bash
# 1. 创建后端项目目录
mkdir professor-website-backend
cd professor-website-backend

# 2. 初始化项目
npm init -y

# 3. 安装依赖
npm install express mysql2 jsonwebtoken bcrypt multer dotenv cors

# 4. 复制示例文件
cp ../professor-website/demo/backend/server.js .

# 5. 创建环境变量文件 .env
cat > .env << EOF
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=professor_website
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
EOF

# 6. 创建上传目录
mkdir uploads

# 7. 启动服务器
node server.js
```

## 🗄️ 数据库初始化

在运行后端之前，需要创建数据库和表：

```sql
-- 创建数据库
CREATE DATABASE professor_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE professor_website;

-- 创建用户表
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student', 'guest') DEFAULT 'student',
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建课程表
CREATE TABLE courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  level ENUM('undergraduate', 'graduate') NOT NULL,
  description TEXT,
  syllabus TEXT,
  status ENUM('active', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_semester (semester),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建课程资料表
CREATE TABLE course_materials (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  chapter_id VARCHAR(36),
  title VARCHAR(200) NOT NULL,
  type ENUM('slide', 'video', 'code', 'document') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size BIGINT,
  download_count INT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建作业表
CREATE TABLE assignments (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  max_score INT DEFAULT 100,
  status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建作业提交表
CREATE TABLE submissions (
  id VARCHAR(36) PRIMARY KEY,
  assignment_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score INT,
  feedback TEXT,
  status ENUM('submitted', 'graded', 'late') DEFAULT 'submitted',
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission (assignment_id, student_id),
  INDEX idx_assignment (assignment_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入测试管理员账号（密码：admin123）
INSERT INTO users (id, email, password_hash, name, role) VALUES 
('admin-001', 'admin@university.edu.cn', '$2b$10$XQlHrL5vqjYGvGxZ5yP5VuYZKGz8YrFq2zHl3xN4mP8vZKGz8YrFq', '张教授', 'admin');
```

## 🔧 配置说明

### 环境变量

后端需要配置以下环境变量（.env 文件）：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=professor_website

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# 文件上传
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800  # 50MB
```

### API端点

后端提供以下主要API端点：

**认证相关**
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册

**课程相关**
- `GET /api/v1/courses` - 获取课程列表
- `GET /api/v1/courses/:id` - 获取课程详情
- `POST /api/v1/courses` - 创建课程（需管理员权限）
- `PUT /api/v1/courses/:id` - 更新课程（需管理员权限）

**资料相关**
- `GET /api/v1/courses/:courseId/materials` - 获取课程资料列表
- `POST /api/v1/materials/upload` - 上传资料（需管理员权限）

**作业相关**
- `GET /api/v1/courses/:courseId/assignments` - 获取作业列表
- `POST /api/v1/assignments/:id/submit` - 提交作业

详细的API文档请参考 `docs/技术开发文档.md`

## 🎨 设计特色

### 视觉设计
- **现代化配色** - 使用专业的蓝色系主色调
- **卡片式布局** - 清晰的信息层次和视觉分组
- **微交互动画** - 流畅的悬停效果和过渡动画
- **响应式设计** - 自适应各种屏幕尺寸

### 用户体验
- **直观导航** - 清晰的页面结构和导航路径
- **快速操作** - 常用功能一键直达
- **即时反馈** - 操作结果实时显示
- **智能筛选** - 多维度筛选，快速找到所需内容

## 📊 项目优势

### 相比传统学术网站

| 特性 | 传统网站 | 本项目 |
|------|---------|--------|
| 界面设计 | 简陋过时 | ✅ 现代化UI |
| 资源管理 | 手动上传困难 | ✅ 可视化后台 |
| 学生互动 | 缺乏互动功能 | ✅ 作业提交系统 |
| 移动访问 | 体验差 | ✅ 响应式设计 |
| 内容更新 | 需要技术支持 | ✅ 自主管理 |
| 数据统计 | 无 | ✅ 访问分析 |

## 🚀 下一步开发建议

### 第一阶段（基础功能）
1. ✅ 完成核心页面开发
2. ✅ 实现用户认证系统
3. ✅ 开发课程管理模块
4. ✅ 实现文件上传下载

### 第二阶段（增强功能）
5. 📧 邮件通知系统
6. 💬 在线讨论区
7. 📊 数据可视化统计
8. 🔍 全站搜索功能

### 第三阶段（高级功能）
9. 📱 微信小程序版本
10. 🤖 AI 智能问答助手
11. 📹 在线视频播放
12. 🎓 学生作品展示

## 🛠️ 技术栈详情

### 前端
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "antd": "^5.12.0",
  "axios": "^1.6.0",
  "dayjs": "^1.11.10",
  "@reduxjs/toolkit": "^2.0.0",
  "react-query": "^3.39.0"
}
```

### 后端
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.5",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "multer": "^1.4.5-lts.1",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "winston": "^3.11.0"
}
```

## 📝 开发规范

### 代码风格
- 使用 ESLint + Prettier 保持代码一致性
- 遵循 Airbnb JavaScript Style Guide
- 组件命名使用 PascalCase
- 函数命名使用 camelCase

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 重构
test: 测试
chore: 构建/工具变动
```

### 测试覆盖率目标
- 单元测试：> 80%
- 集成测试：> 70%
- E2E测试：核心流程 100%

## 🔐 安全性说明

本项目实施了以下安全措施：

1. **认证安全**
   - JWT Token 认证
   - 密码 bcrypt 加密
   - Token 过期机制

2. **数据安全**
   - SQL 参数化查询，防止注入
   - XSS 防护
   - CSRF 防护

3. **文件安全**
   - 文件类型验证
   - 文件大小限制
   - 安全的文件命名

4. **访问控制**
   - RBAC 权限模型
   - API 级别的权限验证

## 📞 技术支持

如有问题或建议，请参考：

- 📖 完整文档: `docs/技术开发文档.md`
- 🎨 原型设计: `prototype/网站原型设计.html`
- 💻 示例代码: `demo/` 目录

## 📄 许可证

本项目仅供学习和参考使用。

## ✨ 致谢

感谢以下开源项目：
- React - UI 框架
- Express - Web 框架
- Ant Design - UI 组件库
- MySQL - 数据库

---

**项目状态**: ✅ 原型设计完成 | 📝 文档齐全 | 💻 示例代码就绪

**建议开发周期**: 6-8周（2名开发人员）

**预算参考**: 
- 开发成本：根据团队情况
- 服务器：500-1000元/月
- 域名：100元/年
- OSS存储：100元/月

祝您的学术网站项目顺利！🎉
