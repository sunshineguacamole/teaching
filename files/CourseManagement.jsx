import React, { useState, useEffect } from 'react';
import './CourseManagement.css';

/**
 * 教授个人网站 - 课程管理示例页面
 * 
 * 功能特性：
 * - 课程列表展示
 * - 课程筛选（学期、层次、状态）
 * - 课程详情查看
 * - 响应式设计
 * 
 * 技术栈：React + Hooks
 */

const CourseManagement = () => {
  // 状态管理
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    semester: '2024春季',
    level: 'all',
    status: 'active'
  });
  const [selectedCourse, setSelectedCourse] = useState(null);

  // 模拟数据（实际使用中从API获取）
  const mockCourses = [
    {
      id: '1',
      title: '软件工程基础',
      code: 'CS101',
      semester: '2024春季',
      level: 'undergraduate',
      status: 'active',
      schedule: '周二 14:00-16:00',
      location: '教学楼 A301',
      enrolled: 68,
      description: '介绍软件工程的基本概念、开发流程、设计模式等核心知识。',
      materials: 15,
      assignments: 5
    },
    {
      id: '2',
      title: '高级软件架构',
      code: 'CS502',
      semester: '2024春季',
      level: 'graduate',
      status: 'active',
      schedule: '周三 09:00-11:00',
      location: '科研楼 B205',
      enrolled: 32,
      description: '深入讲解微服务架构、分布式系统设计、云原生应用开发。',
      materials: 12,
      assignments: 4
    },
    {
      id: '3',
      title: '软件项目管理',
      code: 'CS503',
      semester: '2024春季',
      level: 'graduate',
      status: 'active',
      schedule: '周五 14:00-16:00',
      location: '科研楼 B205',
      enrolled: 28,
      description: '敏捷开发、DevOps实践、团队协作与项目管理方法论。',
      materials: 10,
      assignments: 3
    },
    {
      id: '4',
      title: '云计算与大数据',
      code: 'CS504',
      semester: '2023秋季',
      level: 'graduate',
      status: 'archived',
      schedule: '已结课',
      location: '科研楼 B205',
      enrolled: 35,
      description: '云计算基础架构、大数据处理技术、分布式计算框架。',
      materials: 18,
      assignments: 6
    }
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    // 模拟API调用
    setTimeout(() => {
      setCourses(mockCourses);
      setLoading(false);
    }, 500);
  }, []);

  // 筛选课程
  const filteredCourses = courses.filter(course => {
    const matchSemester = course.semester === filters.semester;
    const matchLevel = filters.level === 'all' || course.level === filters.level;
    const matchStatus = course.status === filters.status;
    return matchSemester && matchLevel && matchStatus;
  });

  // 处理筛选器变化
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 查看课程详情
  const viewCourseDetails = (course) => {
    setSelectedCourse(course);
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="course-management">
      {/* 页面头部 */}
      <header className="page-header">
        <h1>📚 课程中心</h1>
        <p className="subtitle">所有课程及相关资料</p>
      </header>

      {/* 筛选器 */}
      <div className="filters-container">
        <div className="filter-group">
          <label>学期：</label>
          <select
            value={filters.semester}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
          >
            <option value="2024春季">2024春季</option>
            <option value="2023秋季">2023秋季</option>
            <option value="2023春季">2023春季</option>
          </select>
        </div>

        <div className="filter-group">
          <label>层次：</label>
          <select
            value={filters.level}
            onChange={(e) => handleFilterChange('level', e.target.value)}
          >
            <option value="all">全部</option>
            <option value="undergraduate">本科</option>
            <option value="graduate">研究生</option>
          </select>
        </div>

        <div className="filter-group">
          <label>状态：</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="active">进行中</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="courses-section">
        <h2 className="section-title">
          {filters.semester} 学期
          {filters.status === 'archived' && '（已归档）'}
        </h2>

        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <p>😢 暂无符合条件的课程</p>
          </div>
        ) : (
          <div className="course-list">
            {filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onViewDetails={viewCourseDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* 课程详情模态框 */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

/**
 * 课程卡片组件
 */
const CourseCard = ({ course, onViewDetails }) => {
  const levelText = course.level === 'undergraduate' ? '本科' : '研究生';
  const statusClass = course.status === 'archived' ? 'archived' : '';

  return (
    <div className={`course-card ${statusClass}`}>
      <div className="course-card-header">
        <div className="course-icon">💻</div>
        <div className="course-info">
          <h3 className="course-title">{course.title}</h3>
          <p className="course-code">{course.code}</p>
        </div>
        <span className={`level-badge ${course.level}`}>
          {levelText}
        </span>
      </div>

      <div className="course-meta">
        <div className="meta-item">
          <span className="icon">📅</span>
          <span>{course.schedule}</span>
        </div>
        <div className="meta-item">
          <span className="icon">📍</span>
          <span>{course.location}</span>
        </div>
        <div className="meta-item">
          <span className="icon">👥</span>
          <span>已选人数：{course.enrolled}人</span>
        </div>
      </div>

      <p className="course-description">{course.description}</p>

      <div className="course-stats">
        <div className="stat-item">
          <span className="stat-value">{course.materials}</span>
          <span className="stat-label">资料</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{course.assignments}</span>
          <span className="stat-label">作业</span>
        </div>
      </div>

      <button 
        className="view-details-btn"
        onClick={() => onViewDetails(course)}
      >
        查看详情 →
      </button>
    </div>
  );
};

/**
 * 课程详情模态框组件
 */
const CourseDetailModal = ({ course, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="course-detail-header">
          <span className={`level-badge ${course.level}`}>
            {course.level === 'undergraduate' ? '本科课程' : '研究生课程'}
          </span>
          <h2>{course.title}</h2>
          <p className="course-code">{course.code} | {course.semester}</p>
          
          <div className="course-schedule-info">
            <div>📅 {course.schedule}</div>
            <div>📍 {course.location}</div>
            <div>👥 {course.enrolled}人选课</div>
          </div>
        </div>

        <div className="course-detail-body">
          <section>
            <h3>📖 课程简介</h3>
            <p>{course.description}</p>
          </section>

          <section>
            <h3>📊 考核方式</h3>
            <div className="assessment-grid">
              <div className="assessment-item">
                <div className="percentage">30%</div>
                <div className="label">平时作业</div>
              </div>
              <div className="assessment-item">
                <div className="percentage">40%</div>
                <div className="label">课程项目</div>
              </div>
              <div className="assessment-item">
                <div className="percentage">30%</div>
                <div className="label">期末考试</div>
              </div>
            </div>
          </section>

          <section>
            <h3>📁 课程资源</h3>
            <ul className="resource-list">
              <li>📄 课程大纲.pdf</li>
              <li>📊 第1章课件.pptx</li>
              <li>📊 第2章课件.pptx</li>
              <li>💻 示例代码.zip</li>
            </ul>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>关闭</button>
          <button className="btn-primary">进入课程</button>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
