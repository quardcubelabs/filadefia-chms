# TAG Color System Guide

## Official TAG (Tanzania Assemblies of God) Colors

This document defines the color palette used in the Filadefia Christian Center Church Management System, based on the official TAG logo colors.

### Primary Colors from TAG Logo

#### 🔴 TAG Red
**Primary Brand Color**
- **Main**: `#E31E24` (tag-red-500)
- **Usage**: Primary buttons, important alerts, headers, branding elements
- **Example**: 
  ```tsx
  className="bg-tag-red-500 text-white"
  className="text-tag-red-600"
  className="border-tag-red-500"
  ```

#### 💛 TAG Yellow/Gold
**Secondary Brand Color**
- **Main**: `#FFD700` (tag-yellow-500)
- **Usage**: Accents, highlights, secondary buttons, badges, success states
- **Example**:
  ```tsx
  className="bg-tag-yellow-500 text-tag-black"
  className="text-tag-yellow-600"
  className="border-tag-yellow-500"
  ```

#### 🔵 Dark Blue
**Supporting Color (Added)**
- **Main**: `#1D4ED8` (tag-blue-700)
- **Dark**: `#1E3A8A` (tag-blue-900)
- **Usage**: Links, info states, secondary elements, dark mode accents
- **Example**:
  ```tsx
  className="bg-tag-blue-700 text-white"
  className="text-tag-blue-900"
  className="hover:bg-tag-blue-800"
  ```

#### ⚫ TAG Black
**Text & Contrast**
- **Color**: `#000000` (tag-black)
- **Usage**: Primary text, icons, strong emphasis
- **Example**:
  ```tsx
  className="text-tag-black"
  className="bg-tag-black text-tag-white"
  ```

#### ⚪ TAG White
**Background & Contrast**
- **Color**: `#FFFFFF` (tag-white)
- **Usage**: Page backgrounds, cards, text on dark backgrounds
- **Example**:
  ```tsx
  className="bg-tag-white"
  className="text-tag-white"
  ```

---

## Color Scale Reference

### TAG Red Scale
```
tag-red-50:  #fef2f2  (Lightest - backgrounds)
tag-red-100: #fee2e2
tag-red-200: #fecaca
tag-red-300: #fca5a5
tag-red-400: #f87171
tag-red-500: #e31e24  ⭐ PRIMARY
tag-red-600: #dc2626
tag-red-700: #b91c1c
tag-red-800: #991b1b
tag-red-900: #7f1d1d
tag-red-950: #450a0a  (Darkest)
```

### TAG Yellow/Gold Scale
```
tag-yellow-50:  #fefce8  (Lightest - backgrounds)
tag-yellow-100: #fef9c3
tag-yellow-200: #fef08a
tag-yellow-300: #fde047
tag-yellow-400: #facc15
tag-yellow-500: #ffd700  ⭐ PRIMARY
tag-yellow-600: #eab308
tag-yellow-700: #ca8a04
tag-yellow-800: #a16207
tag-yellow-900: #854d0e
tag-yellow-950: #713f12  (Darkest)
```

### TAG Blue Scale
```
tag-blue-50:  #eff6ff  (Lightest - backgrounds)
tag-blue-100: #dbeafe
tag-blue-200: #bfdbfe
tag-blue-300: #93c5fd
tag-blue-400: #60a5fa
tag-blue-500: #3b82f6
tag-blue-600: #2563eb
tag-blue-700: #1d4ed8  ⭐ DARK BLUE
tag-blue-800: #1e40af
tag-blue-900: #1e3a8a  ⭐ DARKER BLUE
tag-blue-950: #0f172a  (Darkest)
```

### TAG Gray Scale (Neutral)
```
tag-gray-50:  #f9fafb  (Lightest - backgrounds)
tag-gray-100: #f3f4f6
tag-gray-200: #e5e7eb
tag-gray-300: #d1d5db
tag-gray-400: #9ca3af
tag-gray-500: #6b7280
tag-gray-600: #4b5563
tag-gray-700: #374151
tag-gray-800: #1f2937
tag-gray-900: #111827
tag-gray-950: #030712  (Darkest)
```

---

## Usage Guidelines

### Button Colors
```tsx
// Primary Action (TAG Red)
<Button className="bg-tag-red-500 hover:bg-tag-red-600 text-white">
  Primary Action
</Button>

// Secondary Action (TAG Yellow)
<Button className="bg-tag-yellow-500 hover:bg-tag-yellow-600 text-tag-black">
  Secondary Action
</Button>

// Info/Link Action (Dark Blue)
<Button className="bg-tag-blue-700 hover:bg-tag-blue-800 text-white">
  Info Action
</Button>

// Outline Button
<Button className="border-2 border-tag-red-500 text-tag-red-500 hover:bg-tag-red-50">
  Outline Button
</Button>
```

### Card Gradients
```tsx
// Red gradient
<div className="bg-gradient-to-br from-tag-red-500 to-tag-red-700">

// Yellow gradient
<div className="bg-gradient-to-br from-tag-yellow-500 to-tag-yellow-600">

// Blue gradient
<div className="bg-gradient-to-br from-tag-blue-700 to-tag-blue-900">

// Multi-color TAG gradient
<div className="bg-gradient-to-r from-tag-red-500 via-tag-yellow-500 to-tag-blue-700">
```

### Status Indicators
```tsx
// Success (Yellow/Gold)
<Badge className="bg-tag-yellow-100 text-tag-yellow-800 border-tag-yellow-300">

// Error (Red)
<Badge className="bg-tag-red-100 text-tag-red-800 border-tag-red-300">

// Info (Blue)
<Badge className="bg-tag-blue-100 text-tag-blue-800 border-tag-blue-300">

// Neutral (Gray)
<Badge className="bg-tag-gray-100 text-tag-gray-800 border-tag-gray-300">
```

### Text Colors
```tsx
// Headings - TAG Black or Red
<h1 className="text-tag-black">Main Heading</h1>
<h1 className="text-tag-red-600">Branded Heading</h1>

// Body Text - Dark Gray
<p className="text-tag-gray-700">Body text content</p>

// Links - Dark Blue
<a className="text-tag-blue-700 hover:text-tag-blue-900">Click here</a>

// Muted Text - Gray
<span className="text-tag-gray-500">Helper text</span>
```

### Shadows
```tsx
// TAG Red shadow
className="shadow-tag"          // Small shadow
className="shadow-tag-lg"       // Large shadow

// TAG Blue shadow
className="shadow-tag-blue"     // Small shadow
className="shadow-tag-blue-lg"  // Large shadow
```

---

## Dark Mode Recommendations

For dark mode, use these adjusted colors:

```tsx
// Background
className="dark:bg-tag-gray-900"

// Cards
className="dark:bg-tag-gray-800"

// Text
className="dark:text-tag-gray-100"

// Primary Button (Red - slightly lighter in dark mode)
className="dark:bg-tag-red-600 dark:hover:bg-tag-red-700"

// Secondary Button (Yellow - adjust for visibility)
className="dark:bg-tag-yellow-600 dark:hover:bg-tag-yellow-700"
```

---

## Accessibility Notes

### Contrast Ratios (WCAG AA Compliant)

✅ **Good Combinations:**
- `tag-red-500` text on `tag-white` background
- `tag-white` text on `tag-red-600` background
- `tag-blue-900` text on `tag-white` background
- `tag-black` text on `tag-yellow-500` background

⚠️ **Avoid:**
- Light yellow text on white backgrounds
- Light blue text on white backgrounds

### Color Blindness Considerations

The TAG color palette (Red, Yellow, Blue) is distinguishable by most color-blind users when used with:
- Sufficient contrast
- Icons or text labels alongside colors
- Different shades/brightness levels

---

## Component Library Integration

All UI components automatically support TAG colors through these props:

```tsx
// Button variants
<Button variant="primary">    {/* TAG Red */}
<Button variant="secondary">  {/* TAG Yellow */}
<Button variant="info">       {/* TAG Blue */}

// Badge variants
<Badge variant="error">       {/* TAG Red */}
<Badge variant="warning">     {/* TAG Yellow */}
<Badge variant="info">        {/* TAG Blue */}

// Alert variants
<Alert variant="error">       {/* TAG Red */}
<Alert variant="warning">     {/* TAG Yellow */}
<Alert variant="info">        {/* TAG Blue */}
```

---

## Migration from FCC Colors

For backwards compatibility, `fcc-blue`, `fcc-gold`, and `fcc-red` aliases point to TAG colors:

```tsx
// Old (still works)
className="bg-fcc-blue-600"
className="text-fcc-gold-500"

// New (recommended)
className="bg-tag-blue-700"
className="text-tag-yellow-500"
```

---

**Last Updated**: November 6, 2025  
**Version**: 1.0.0
