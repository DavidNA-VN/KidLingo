# Doodle English Classroom Design System

デザインシステム・ガイドライン

---

## Overview

Doodle English Classroomは、日本の先生、保護者、小学生を対象とした英語学習プラットフォームです。このデザインシステムは、子どもにとって親しみやすく、教師や保護者にとって信頼できる、明るくモダンなEdTech体験を提供します。

### Design Principles

1. **親しみやすさ (Approachability)** - 子どもが安心して使える、優しいビジュアル
2. **明快さ (Clarity)** - 情報が整理され、分かりやすいインターフェース
3. **信頼性 (Trust)** - 教育者と保護者が信頼できるプロフェッショナルな品質
4. **楽しさ (Joy)** - 学習を楽しくする、明るく前向きなトーン

---

## Color System

### Primary Colors

```css
/* ソフトブルー - メインカラー */
--color-primary-50: #e8f4ff;
--color-primary-100: #d0e8ff;
--color-primary-200: #a8d8ff;
--color-primary-300: #78c3ff;
--color-primary-400: #4aa7ff;
--color-primary-500: #2b8cff;  /* Primary */
--color-primary-600: #1a6fd4;
--color-primary-700: #1055a8;
--color-primary-800: #0a3d7d;
--color-primary-900: #052952;

/* ウォームイエロー - アクセント */
--color-secondary-50: #fffbea;
--color-secondary-100: #fff5c7;
--color-secondary-200: #ffeb8f;
--color-secondary-300: #ffdc57;
--color-secondary-400: #ffcd2b;
--color-secondary-500: #ffc107;  /* Secondary */
--color-secondary-600: #e6a500;
--color-secondary-700: #c78700;
--color-secondary-800: #a86d00;
--color-secondary-900: #7a4f00;

/* ミントグリーン - 成功・ポジティブ */
--color-success-50: #e8fdf5;
--color-success-100: #c7f9e3;
--color-success-200: #8ff3c7;
--color-success-300: #57e8ab;
--color-success-400: #2bd894;
--color-success-500: #0cc57d;  /* Success */
--color-success-600: #08a869;
--color-success-700: #068a56;
--color-success-800: #046c43;
--color-success-900: #025030;
```

### Semantic Colors

```css
/* エラー - 赤系 */
--color-error-50: #fff0f0;
--color-error-100: #ffd9d9;
--color-error-200: #ffb3b3;
--color-error-300: #ff8a8a;
--color-error-400: #ff6161;
--color-error-500: #ff3838;  /* Error */
--color-error-600: #e02020;
--color-error-700: #b81818;
--color-error-800: #8f1212;
--color-error-900: #660d0d;

/* 警告 - オレンジ系 */
--color-warning-50: #fff8ed;
--color-warning-100: #ffeed4;
--color-warning-200: #ffdba8;
--color-warning-300: #ffc57d;
--color-warning-400: #ffad52;
--color-warning-500: #ff9529;  /* Warning */
--color-warning-600: #e07a15;
--color-warning-700: #b8610d;
--color-warning-800: #8f4a08;
--color-warning-900: #663505;

/* 情報 - 青系 */
--color-info-50: #e8f4ff;
--color-info-100: #d0e8ff;
--color-info-200: #a8d8ff;
--color-info-300: #78c3ff;
--color-info-400: #4aa7ff;
--color-info-500: #2b8cff;  /* Info */
--color-info-600: #1a6fd4;
--color-info-700: #1055a8;
--color-info-800: #0a3d7d;
--color-info-900: #052952;
```

### Neutral Colors

```css
/* グレースケール */
--color-neutral-0: #ffffff;      /* White */
--color-neutral-50: #fafbfc;     /* Off-white */
--color-neutral-100: #f5f6f8;    /* Light gray background */
--color-neutral-200: #e8eaed;    /* Border, divider */
--color-neutral-300: #d1d5db;    /* Disabled */
--color-neutral-400: #9ca3af;    /* Placeholder */
--color-neutral-500: #6b7280;    /* Secondary text */
--color-neutral-600: #4b5563;    /* Body text */
--color-neutral-700: #374151;    /* Heading */
--color-neutral-800: #1f2937;    /* Dark heading */
--color-neutral-900: #111827;    /* Darkest */
```

### Background Colors

```css
--color-bg-primary: var(--color-neutral-0);       /* #ffffff */
--color-bg-secondary: var(--color-neutral-50);    /* #fafbfc */
--color-bg-tertiary: var(--color-neutral-100);    /* #f5f6f8 */
--color-bg-blue-light: var(--color-primary-50);   /* #e8f4ff */
--color-bg-yellow-light: var(--color-secondary-50); /* #fffbea */
--color-bg-green-light: var(--color-success-50);  /* #e8fdf5 */
```

---

## Typography

### Font Families

```css
/* 日本語対応フォントスタック */
--font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", 
                    "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, Meiryo, 
                    sans-serif;

--font-family-heading: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", 
                       "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, Meiryo, 
                       sans-serif;

--font-family-mono: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", 
                    monospace;
```

### Type Scale

```css
/* Font Sizes */
--text-xs: 12px;      /* 補助情報 */
--text-sm: 14px;      /* 小さめのテキスト */
--text-base: 16px;    /* 本文 */
--text-lg: 18px;      /* リード文 */
--text-xl: 20px;      /* 小見出し */
--text-2xl: 24px;     /* 見出しH3 */
--text-3xl: 30px;     /* 見出しH2 */
--text-4xl: 36px;     /* 見出しH1 */
--text-5xl: 48px;     /* ヒーロー見出し */
--text-6xl: 60px;     /* 特大見出し */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--leading-tight: 1.25;    /* 見出し用 */
--leading-snug: 1.375;    /* タイトル用 */
--leading-normal: 1.5;    /* 本文用 */
--leading-relaxed: 1.625; /* ゆったりした本文 */
--leading-loose: 2;       /* 教材・学習テキスト */

/* Letter Spacing */
--tracking-tight: -0.01em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
```

### Typography Components

```css
/* Heading 1 - ページタイトル */
.heading-1 {
  font-size: var(--text-4xl);      /* 36px */
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
  color: var(--color-neutral-800);
  margin-bottom: 24px;
}

/* Heading 2 - セクション見出し */
.heading-2 {
  font-size: var(--text-3xl);      /* 30px */
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
  color: var(--color-neutral-800);
  margin-bottom: 20px;
}

/* Heading 3 - サブセクション見出し */
.heading-3 {
  font-size: var(--text-2xl);      /* 24px */
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-snug);
  color: var(--color-neutral-700);
  margin-bottom: 16px;
}

/* Body Large - リード文 */
.body-large {
  font-size: var(--text-lg);       /* 18px */
  font-weight: var(--font-weight-normal);
  line-height: var(--leading-relaxed);
  color: var(--color-neutral-600);
}

/* Body - 本文 */
.body {
  font-size: var(--text-base);     /* 16px */
  font-weight: var(--font-weight-normal);
  line-height: var(--leading-normal);
  color: var(--color-neutral-600);
}

/* Body Small - 補助テキスト */
.body-small {
  font-size: var(--text-sm);       /* 14px */
  font-weight: var(--font-weight-normal);
  line-height: var(--leading-normal);
  color: var(--color-neutral-500);
}

/* Caption - キャプション */
.caption {
  font-size: var(--text-xs);       /* 12px */
  font-weight: var(--font-weight-normal);
  line-height: var(--leading-normal);
  color: var(--color-neutral-500);
}
```

---

## Spacing System

```css
/* Spacing Scale - 4px base */
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;

/* Component Spacing */
--spacing-component-xs: var(--space-2);   /* 8px */
--spacing-component-sm: var(--space-3);   /* 12px */
--spacing-component-md: var(--space-4);   /* 16px */
--spacing-component-lg: var(--space-6);   /* 24px */
--spacing-component-xl: var(--space-8);   /* 32px */

/* Section Spacing */
--spacing-section-sm: var(--space-12);    /* 48px */
--spacing-section-md: var(--space-16);    /* 64px */
--spacing-section-lg: var(--space-20);    /* 80px */
--spacing-section-xl: var(--space-24);    /* 96px */
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;     /* 小さい要素 */
--radius-md: 8px;     /* ボタン、入力欄 */
--radius-lg: 12px;    /* カード */
--radius-xl: 16px;    /* 大きいカード */
--radius-2xl: 20px;   /* モーダル */
--radius-full: 9999px; /* 円形、ピル型 */
```

---

## Shadows

```css
/* Elevation Shadows */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08), 
             0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 
             0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08), 
             0 4px 6px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.10), 
             0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);

/* Colored Shadows for interactive elements */
--shadow-primary: 0 4px 12px rgba(43, 140, 255, 0.20);
--shadow-success: 0 4px 12px rgba(12, 197, 125, 0.20);
--shadow-warning: 0 4px 12px rgba(255, 149, 41, 0.20);
--shadow-error: 0 4px 12px rgba(255, 56, 56, 0.20);
```

---

## Button Styles

### Primary Button

プライマリアクション用（例：送信、保存、次へ）

```css
.button-primary {
  padding: 12px 24px;
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-0);
  background-color: var(--color-primary-500);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary:hover {
  background-color: var(--color-primary-600);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.button-primary:active {
  background-color: var(--color-primary-700);
  box-shadow: var(--shadow-xs);
  transform: translateY(0);
}

.button-primary:disabled {
  background-color: var(--color-neutral-300);
  color: var(--color-neutral-500);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
```

### Secondary Button

セカンダリアクション用（例：キャンセル、戻る）

```css
.button-secondary {
  padding: 12px 24px;
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-600);
  background-color: var(--color-neutral-0);
  border: 2px solid var(--color-primary-500);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-secondary:hover {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-600);
  transform: translateY(-1px);
}

.button-secondary:active {
  background-color: var(--color-primary-100);
  transform: translateY(0);
}

.button-secondary:disabled {
  color: var(--color-neutral-400);
  border-color: var(--color-neutral-300);
  cursor: not-allowed;
  transform: none;
}
```

### Ghost Button

軽量アクション用（例：詳細を見る、もっと見る）

```css
.button-ghost {
  padding: 12px 24px;
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-600);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-ghost:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-700);
}

.button-ghost:active {
  background-color: var(--color-primary-100);
}

.button-ghost:disabled {
  color: var(--color-neutral-400);
  cursor: not-allowed;
}
```

### Success Button

成功アクション用（例：完了、公開）

```css
.button-success {
  padding: 12px 24px;
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-0);
  background-color: var(--color-success-500);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-success:hover {
  background-color: var(--color-success-600);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Button Sizes

```css
/* Small */
.button-sm {
  padding: 8px 16px;
  font-size: var(--text-sm);
}

/* Medium (default) */
.button-md {
  padding: 12px 24px;
  font-size: var(--text-base);
}

/* Large */
.button-lg {
  padding: 16px 32px;
  font-size: var(--text-lg);
}

/* Icon Only */
.button-icon {
  padding: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Form Styles

### Text Input

```css
.input-text {
  width: 100%;
  padding: 12px 16px;
  font-size: var(--text-base);
  font-family: var(--font-family-base);
  color: var(--color-neutral-700);
  background-color: var(--color-neutral-0);
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.input-text::placeholder {
  color: var(--color-neutral-400);
}

.input-text:hover {
  border-color: var(--color-neutral-300);
}

.input-text:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(43, 140, 255, 0.1);
}

.input-text:disabled {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-500);
  cursor: not-allowed;
}

.input-text.error {
  border-color: var(--color-error-500);
}

.input-text.error:focus {
  box-shadow: 0 0 0 3px rgba(255, 56, 56, 0.1);
}

.input-text.success {
  border-color: var(--color-success-500);
}
```

### Textarea

```css
.input-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px 16px;
  font-size: var(--text-base);
  font-family: var(--font-family-base);
  color: var(--color-neutral-700);
  background-color: var(--color-neutral-0);
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  resize: vertical;
  transition: all 0.2s ease;
}

.input-textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(43, 140, 255, 0.1);
}
```

### Select

```css
.input-select {
  width: 100%;
  padding: 12px 40px 12px 16px;
  font-size: var(--text-base);
  font-family: var(--font-family-base);
  color: var(--color-neutral-700);
  background-color: var(--color-neutral-0);
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-select:hover {
  border-color: var(--color-neutral-300);
}

.input-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(43, 140, 255, 0.1);
}
```

### Checkbox

```css
.input-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-sm);
  background-color: var(--color-neutral-0);
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-checkbox:checked {
  background-color: var(--color-primary-500);
  border-color: var(--color-primary-500);
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='10' viewBox='0 0 12 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 5L4.5 8.5L11 1.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.input-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(43, 140, 255, 0.1);
}
```

### Radio Button

```css
.input-radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  background-color: var(--color-neutral-0);
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-radio:checked {
  border-color: var(--color-primary-500);
  border-width: 6px;
}

.input-radio:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(43, 140, 255, 0.1);
}
```

### Form Labels

```css
.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
}

.form-label-required::after {
  content: " *";
  color: var(--color-error-500);
}
```

### Form Helper Text

```css
.form-helper {
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--color-neutral-500);
}

.form-error {
  margin-top: 6px;
  font-size: var(--text-xs);
  color: var(--color-error-500);
}
```

---

## Card Styles

### Basic Card

```css
.card {
  background-color: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Lesson Card

レッスン・教材カード用

```css
.card-lesson {
  background-color: var(--color-neutral-0);
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-lesson:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}

.card-lesson-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.card-lesson-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.card-lesson-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
}

.card-lesson-description {
  font-size: var(--text-sm);
  color: var(--color-neutral-600);
  margin-bottom: var(--space-4);
}

.card-lesson-meta {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-neutral-500);
}
```

### Content Card with Image

```css
.card-content {
  background-color: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease;
}

.card-content:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-content-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background-color: var(--color-neutral-100);
}

.card-content-body {
  padding: var(--space-6);
}

.card-content-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
  margin-bottom: var(--space-2);
}

.card-content-text {
  font-size: var(--text-sm);
  color: var(--color-neutral-600);
  line-height: var(--leading-relaxed);
}
```

---

## Table Styles

### Basic Table

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  background-color: var(--color-neutral-50);
}

.table-header-cell {
  padding: 12px 16px;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
  border-bottom: 2px solid var(--color-neutral-200);
}

.table-row {
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background-color: var(--color-neutral-50);
}

.table-row:not(:last-child) {
  border-bottom: 1px solid var(--color-neutral-200);
}

.table-cell {
  padding: 16px;
  font-size: var(--text-sm);
  color: var(--color-neutral-600);
}

.table-cell-primary {
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-800);
}
```

### Student Progress Table

```css
.table-student-progress .table-header-cell:first-child {
  border-top-left-radius: var(--radius-lg);
}

.table-student-progress .table-header-cell:last-child {
  border-top-right-radius: var(--radius-lg);
}

.table-progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.table-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-success-400), var(--color-success-500));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
```

---

## Chat Bubble Styles

### Teacher Message

```css
.chat-bubble-teacher {
  max-width: 70%;
  padding: 12px 16px;
  background-color: var(--color-primary-500);
  color: var(--color-neutral-0);
  border-radius: 16px 16px 16px 4px;
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  box-shadow: var(--shadow-sm);
}

.chat-bubble-teacher-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.chat-bubble-teacher-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-weight-semibold);
}

.chat-bubble-teacher-name {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-100);
}
```

### Student Message

```css
.chat-bubble-student {
  max-width: 70%;
  padding: 12px 16px;
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-800);
  border-radius: 16px 16px 4px 16px;
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  box-shadow: var(--shadow-sm);
}

.chat-bubble-student-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.chat-bubble-student-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-secondary-400);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-weight-semibold);
}

.chat-bubble-student-name {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
}
```

### System Message

```css
.chat-bubble-system {
  max-width: 90%;
  padding: 8px 12px;
  background-color: var(--color-bg-blue-light);
  color: var(--color-primary-700);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  text-align: center;
  margin: var(--space-2) auto;
}
```

---

## Badge Styles

### Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
}

.badge-success {
  background-color: var(--color-success-100);
  color: var(--color-success-700);
}

.badge-warning {
  background-color: var(--color-warning-100);
  color: var(--color-warning-700);
}

.badge-error {
  background-color: var(--color-error-100);
  color: var(--color-error-700);
}

.badge-info {
  background-color: var(--color-info-100);
  color: var(--color-info-700);
}

.badge-neutral {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-700);
}
```

### Count Badge

```css
.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: var(--color-error-500);
  color: var(--color-neutral-0);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}
```

---

## Reward Badge Styles

### Achievement Badge

生徒の達成バッジ

```css
.reward-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--color-bg-yellow-light), var(--color-neutral-0));
  border: 2px solid var(--color-secondary-300);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.reward-badge:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.reward-badge-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-secondary-400), var(--color-secondary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  box-shadow: var(--shadow-md);
}

.reward-badge-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-800);
  text-align: center;
}

.reward-badge-description {
  font-size: var(--text-xs);
  color: var(--color-neutral-600);
  text-align: center;
}
```

### Star Badge (Progress)

```css
.reward-star {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-secondary-400), var(--color-secondary-500));
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.reward-star:hover {
  transform: rotate(72deg) scale(1.1);
}

.reward-star-empty {
  background: var(--color-neutral-200);
  box-shadow: none;
}
```

### Medal Badge

```css
.reward-medal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.reward-medal-circle {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-secondary-300), var(--color-secondary-500));
  border: 4px solid var(--color-secondary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-lg);
  position: relative;
}

.reward-medal-circle::before {
  content: '';
  position: absolute;
  top: -20px;
  width: 20px;
  height: 30px;
  background-color: var(--color-error-500);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.reward-medal-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-800);
}
```

---

## State Patterns

### Success State

```css
.state-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
}

.state-success-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background-color: var(--color-success-100);
  color: var(--color-success-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: var(--space-6);
}

.state-success-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-800);
  margin-bottom: var(--space-3);
}

.state-success-message {
  font-size: var(--text-base);
  color: var(--color-neutral-600);
  max-width: 400px;
  margin-bottom: var(--space-6);
}
```

**Example:**
```html
<div class="state-success">
  <div class="state-success-icon">✓</div>
  <h2 class="state-success-title">レッスン完了！</h2>
  <p class="state-success-message">素晴らしい！今日のレッスンをすべて完了しました。</p>
  <button class="button-primary">次のレッスンへ</button>
</div>
```

---

### Error State

```css
.state-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
}

.state-error-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background-color: var(--color-error-100);
  color: var(--color-error-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: var(--space-6);
}

.state-error-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-800);
  margin-bottom: var(--space-3);
}

.state-error-message {
  font-size: var(--text-base);
  color: var(--color-neutral-600);
  max-width: 400px;
  margin-bottom: var(--space-6);
}
```

**Example:**
```html
<div class="state-error">
  <div class="state-error-icon">×</div>
  <h2 class="state-error-title">エラーが発生しました</h2>
  <p class="state-error-message">申し訳ございません。問題が発生しました。もう一度お試しください。</p>
  <button class="button-primary">再試行</button>
</div>
```

---

### Empty State

```css
.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  text-align: center;
}

.state-empty-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: var(--space-6);
  opacity: 0.6;
}

.state-empty-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
  margin-bottom: var(--space-3);
}

.state-empty-message {
  font-size: var(--text-base);
  color: var(--color-neutral-500);
  max-width: 400px;
  margin-bottom: var(--space-6);
}
```

**Example:**
```html
<div class="state-empty">
  <div class="state-empty-illustration">
    <!-- SVG illustration or image -->
    <svg>...</svg>
  </div>
  <h2 class="state-empty-title">まだレッスンがありません</h2>
  <p class="state-empty-message">新しいレッスンを作成して、生徒と共有しましょう。</p>
  <button class="button-primary">レッスンを作成</button>
</div>
```

---

### Loading State

```css
.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
}

.state-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-neutral-200);
  border-top-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--space-6);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-loading-message {
  font-size: var(--text-base);
  color: var(--color-neutral-600);
}
```

**Example:**
```html
<div class="state-loading">
  <div class="state-loading-spinner"></div>
  <p class="state-loading-message">読み込み中...</p>
</div>
```

---

## Animation & Transitions

### Standard Transitions

```css
/* Default transition for interactive elements */
--transition-base: all 0.2s ease;
--transition-fast: all 0.15s ease;
--transition-slow: all 0.3s ease;

/* Easing functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effects

```css
/* Lift on hover */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Scale on hover */
.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

---

## Accessibility

### Focus States

```css
/* Visible focus ring */
.focus-ring:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Focus within */
.focus-within:focus-within {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(43, 140, 255, 0.1);
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Responsive Breakpoints

```css
/* Desktop First Approach */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-xs: 375px;   /* Mobile portrait */
```

---

## Usage Guidelines

### Color Usage

1. **Primary Blue**: メインアクション、リンク、選択状態
2. **Secondary Yellow**: アクセント、ハイライト、楽しい要素
3. **Success Green**: 正解、完了、ポジティブフィードバック
4. **Error Red**: エラー、不正解、警告
5. **Neutral Gray**: テキスト、背景、ボーダー

### Typography Usage

1. **見出し**: Bold weight、大きめのサイズ、適度な余白
2. **本文**: Normal weight、16px base、1.5 line-height
3. **ラベル・キャプション**: Medium weight、小さめのサイズ

### Spacing Usage

1. **コンポーネント内**: 8px〜24px
2. **コンポーネント間**: 24px〜48px
3. **セクション間**: 48px〜96px

### Component Selection

1. **Primary Button**: 最も重要なアクション（1ページに1〜2つまで）
2. **Secondary Button**: サブアクション
3. **Ghost Button**: 軽量なアクション、リンク代替

---

## Examples

### Login Form Example

```html
<div class="card" style="max-width: 400px; margin: 0 auto;">
  <h2 class="heading-2">ログイン</h2>
  
  <form>
    <div style="margin-bottom: 16px;">
      <label class="form-label form-label-required">メールアドレス</label>
      <input type="email" class="input-text" placeholder="your@email.com" required />
    </div>
    
    <div style="margin-bottom: 16px;">
      <label class="form-label form-label-required">パスワード</label>
      <input type="password" class="input-text" required />
      <p class="form-helper">8文字以上で入力してください</p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <label style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" class="input-checkbox" />
        <span class="body-small">ログイン状態を保持する</span>
      </label>
    </div>
    
    <button type="submit" class="button-primary" style="width: 100%;">
      ログイン
    </button>
    
    <button type="button" class="button-ghost" style="width: 100%; margin-top: 12px;">
      パスワードを忘れた方
    </button>
  </form>
</div>
```

### Student Dashboard Example

```html
<div style="padding: 48px;">
  <h1 class="heading-1">こんにちは、太郎くん！</h1>
  
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px;">
    <!-- Lesson Card 1 -->
    <div class="card-lesson">
      <div class="card-lesson-header">
        <div class="card-lesson-icon">📚</div>
        <div>
          <div class="card-lesson-title">アルファベット</div>
        </div>
      </div>
      <p class="card-lesson-description">
        A〜Zまでのアルファベットを学びましょう
      </p>
      <div class="card-lesson-meta">
        <span>⏱ 15分</span>
        <span>⭐ 0/5</span>
      </div>
    </div>
    
    <!-- Lesson Card 2 -->
    <div class="card-lesson">
      <div class="card-lesson-header">
        <div class="card-lesson-icon" style="background: linear-gradient(135deg, var(--color-success-400), var(--color-success-600));">🎯</div>
        <div>
          <div class="card-lesson-title">数字</div>
        </div>
      </div>
      <p class="card-lesson-description">
        1〜10までの数字を英語で言ってみよう
      </p>
      <div class="card-lesson-meta">
        <span>⏱ 10分</span>
        <span>⭐ 3/5</span>
      </div>
    </div>
    
    <!-- Lesson Card 3 -->
    <div class="card-lesson">
      <div class="card-lesson-header">
        <div class="card-lesson-icon" style="background: linear-gradient(135deg, var(--color-secondary-400), var(--color-secondary-600));">🌈</div>
        <div>
          <div class="card-lesson-title">色</div>
        </div>
      </div>
      <p class="card-lesson-description">
        いろいろな色の名前を覚えよう
      </p>
      <div class="card-lesson-meta">
        <span>⏱ 12分</span>
        <span>⭐ 5/5 完了</span>
      </div>
    </div>
  </div>
  
  <!-- Rewards Section -->
  <h2 class="heading-2">獲得したバッジ</h2>
  <div style="display: flex; gap: 24px;">
    <div class="reward-badge">
      <div class="reward-badge-icon">🏆</div>
      <div class="reward-badge-title">初心者</div>
      <p class="reward-badge-description">最初のレッスン完了</p>
    </div>
    
    <div class="reward-badge">
      <div class="reward-badge-icon">⭐</div>
      <div class="reward-badge-title">星集め</div>
      <p class="reward-badge-description">星10個獲得</p>
    </div>
  </div>
</div>
```

---

## Notes

- **日本語フォント**: システムフォントを使用し、Windows/Mac両方で美しく表示
- **アクセシビリティ**: 十分なコントラスト比、フォーカス状態の明確化
- **レスポンシブ**: Desktop firstだが、必要に応じてタブレット・モバイル対応
- **パフォーマンス**: アニメーションは控えめ、シンプルなトランジション
- **一貫性**: 全コンポーネントで同じトークンとパターンを使用

---

## Changelog

**Version 1.0** - 2026-05-25
- Initial design system creation
- Complete color palette
- Typography system
- Component library
- State patterns
- Japanese language support
