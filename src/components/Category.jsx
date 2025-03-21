import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Category.css';

// Импортируем иконки (замените на свои пути)
import ortIcon from '../assets/ort-icon.svg';
import englishIcon from '../assets/english-icon.svg';
import mathIcon from '../assets/math-icon.svg';
import itIcon from '../assets/it-icon.svg';
import russianIcon from '../assets/russian-icon.svg';
import salesIcon from '../assets/sales-icon.svg';
import designIcon from '../assets/design-icon.svg';
import musicIcon from '../assets/music-icon.svg';

const categories = [
  {
    title: 'Preparation for ORT',
    description: 'Math, Literature, History & more',
    icon: ortIcon,
    link: '/category/ort',
  },
  {
    title: 'English language',
    description: 'Grammar, Speaking, Reading & more',
    icon: englishIcon,
    link: '/category/english',
  },
  {
    title: 'Mathematics',
    description: 'Math logic, Math Discrete & more',
    icon: mathIcon,
    link: '/category/math',
  },
  {
    title: 'IT',
    description: 'Python, JavaScript & more',
    icon: itIcon,
    link: '/category/it',
  },
  {
    title: 'Russian language',
    description: 'Grammar, Speaking, Reading & more',
    icon: russianIcon,
    link: '/category/russian',
  },
  {
    title: 'Sales & Marketing',
    description: 'Mark. analysis, Brand management & more',
    icon: salesIcon,
    link: '/category/sales',
  },
  {
    title: 'Graphics & Design',
    description: 'Figma, Adobe Illustrator, Photoshop & more',
    icon: designIcon,
    link: '/category/design',
  },
  {
    title: 'Music',
    description: 'Singing, Guitar, Piano & more',
    icon: musicIcon,
    link: '/category/music',
  },
];

const Category = () => {
  return (
    <section className="category-section inter">
      <div className="category-header">
        <span className="category-subtitle">Tutors by Categories</span>
        <h2 className="category-title">Select the Category of Your Choice</h2>
      </div>
      <div className="category-grid">
        {categories.map((category, index) => (
          <Link to={category.link} key={index} className="category-card">
            <div className="category-icon">
              <img src={category.icon} alt={`${category.title} icon`} />
            </div>
            <h3 className="category-card-title">{category.title}</h3>
            <p className="category-card-description">{category.description}</p>
            <span className="category-card-link">show more</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Category;