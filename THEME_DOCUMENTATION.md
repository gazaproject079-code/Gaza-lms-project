# SkillSphere Design System

## Theme Philosophy: Cyberpunk Meets Minimalism

A premium, futuristic design system that combines the electric energy of cyberpunk aesthetics with the elegance of minimalist design. The theme features neon purples and electric blues, creating a sophisticated visual language that feels both cutting-edge and refined.

---

## Color Palette

### Light Mode - Clean & Premium

#### Primary Colors (Vibrant Purple)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#7C3AED` | Main brand color, CTAs, active states |
| `primaryDark` | `#5B21B6` | Hover states, emphasis |
| `primaryLight` | `#A78BFA` | Highlights, accents |
| `primaryMuted` | `#C4B5FD` | Subtle backgrounds, disabled states |

#### Secondary Colors (Electric Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| `secondary` | `#0EA5E9` | Secondary actions, links |
| `secondaryDark` | `#0284C7` | Hover states |
| `secondaryLight` | `#38BDF8` | Highlights |
| `secondaryMuted` | `#7DD3FC` | Subtle accents |

#### Gradient Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `gradientStart` | `#7C3AED` | Gradient start (purple) |
| `gradientMid` | `#6366F1` | Gradient middle (indigo) |
| `gradientEnd` | `#0EA5E9` | Gradient end (blue) |

#### Background Colors (Ice White Palette)
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F8FAFC` | Main page background |
| `backgroundSecondary` | `#F1F5F9` | Secondary sections |
| `backgroundTertiary` | `#E2E8F0` | Tertiary areas |
| `surface` | `#FFFFFF` | Cards, elevated surfaces |

#### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#1E293B` | Headlines, body text |
| `textSecondary` | `#64748B` | Subtitles, descriptions |
| `textTertiary` | `#94A3B8` | Metadata, hints |
| `textMuted` | `#CBD5E1` | Disabled text |
| `textInverse` | `#FFFFFF` | Text on dark backgrounds |

#### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Success states |
| `error` | `#EF4444` | Error states |
| `warning` | `#F59E0B` | Warning states |
| `info` | `#0EA5E9` | Info states |

---

### Dark Mode - Cyberpunk Neon

#### Primary Colors (Neon Purple)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#A78BFA` | Neon purple primary |
| `primaryDark` | `#7C3AED` | Darker purple accent |
| `primaryLight` | `#C4B5FD` | Light purple highlight |
| `primaryMuted` | `#6D28D9` | Muted purple |

#### Secondary Colors (Neon Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| `secondary` | `#38BDF8` | Neon blue secondary |
| `secondaryDark` | `#0EA5E9` | Darker blue |
| `secondaryLight` | `#7DD3FC` | Light blue |
| `secondaryMuted` | `#0284C7` | Muted blue |

#### Background Colors (Deep Space Black)
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0F0F23` | Deep space black |
| `backgroundSecondary` | `#1A1A2E` | Elevated dark surface |
| `backgroundTertiary` | `#252542` | Higher elevation |
| `surface` | `#1A1A2E` | Card backgrounds |

#### Card Colors (Glassmorphism)
| Token | Value | Usage |
|-------|-------|-------|
| `card` | `rgba(26, 26, 46, 0.8)` | Glass card background |
| `cardElevated` | `rgba(37, 37, 66, 0.9)` | Elevated glass |
| `cardGlass` | `rgba(26, 26, 46, 0.6)` | Transparent glass |
| `cardBorder` | `rgba(167, 139, 250, 0.2)` | Neon border |
| `cardBorderHover` | `rgba(167, 139, 250, 0.5)` | Hover border glow |

#### Text Colors (High Contrast)
| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#F8FAFC` | Bright white text |
| `textSecondary` | `#CBD5E1` | Secondary text |
| `textTertiary` | `#94A3B8` | Tertiary text |
| `textMuted` | `#64748B` | Muted text |

---

## Typography

### Font Family
```
Inter (all weights)
- Regular: 400
- Medium: 500
- SemiBold: 600
- Bold: 700
```

### Font Sizes
| Token | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Small labels, badges |
| `sm` | 14px | Body small, captions |
| `base` | 16px | Body text |
| `lg` | 18px | Subheadings |
| `xl` | 20px | Section titles |
| `2xl` | 24px | Card titles |
| `3xl` | 30px | Page titles |
| `4xl` | 36px | Hero text |
| `5xl` | 48px | Display text |

### Line Heights
| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.25 | Headlines |
| `normal` | 1.5 | Body text |
| `relaxed` | 1.75 | Long-form content |

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight spacing |
| `sm` | 8px | Small gaps |
| `md` | 16px | Default padding |
| `lg` | 24px | Section padding |
| `xl` | 32px | Large sections |
| `2xl` | 48px | Hero sections |
| `3xl` | 64px | Page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Sharp edges |
| `sm` | 4px | Subtle rounding |
| `md` | 8px | Buttons, inputs |
| `lg` | 12px | Cards, modals |
| `xl` | 16px | Large cards |
| `2xl` | 20px | Feature cards |
| `3xl` | 24px | Hero sections |
| `full` | 9999px | Pills, avatars |

---

## Shadows

### Light Mode Shadows
```javascript
shadows: {
  sm: { offset: [0, 1], opacity: 0.05, radius: 2 },
  md: { offset: [0, 4], opacity: 0.08, radius: 6 },
  lg: { offset: [0, 8], opacity: 0.12, radius: 16 },
  xl: { offset: [0, 12], opacity: 0.15, radius: 24 },
  glow: { offset: [0, 4], opacity: 0.3, radius: 12, color: '#7C3AED' }
}
```

### Dark Mode Shadows (Neon Glow)
```javascript
shadows: {
  sm: { offset: [0, 1], opacity: 0.3, radius: 2 },
  md: { offset: [0, 4], opacity: 0.4, radius: 6 },
  lg: { offset: [0, 8], opacity: 0.5, radius: 16 },
  xl: { offset: [0, 12], opacity: 0.6, radius: 24 },
  glow: { offset: [0, 0], opacity: 0.5, radius: 20, color: '#A78BFA' },
  glowBlue: { offset: [0, 0], opacity: 0.5, radius: 20, color: '#38BDF8' }
}
```

---

## Glassmorphism

### Light Mode
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(124, 58, 237, 0.1);
```

### Dark Mode
```css
background: rgba(26, 26, 46, 0.6);
backdrop-filter: blur(16px);
border: 1px solid rgba(167, 139, 250, 0.2);
```

---

## Component Specifications

### AppButton

#### Variants
| Variant | Description | Gradient |
|---------|-------------|----------|
| `primary` | Main CTA | Purple to Blue gradient |
| `secondary` | Secondary actions | Solid background with border |
| `outline` | Tertiary actions | Transparent with border |
| `ghost` | Minimal actions | Transparent, no border |
| `danger` | Destructive actions | Red gradient |
| `success` | Positive actions | Green gradient |

#### Sizes
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | 40px | 16px | 14px |
| `md` | 48px | 24px | 16px |
| `lg` | 56px | 32px | 18px |

#### Props
```typescript
interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
}
```

#### Usage
```jsx
<AppButton
  title="Get Started"
  onPress={handlePress}
  variant="primary"
  size="lg"
  glow
/>
```

---

### AppCard

#### Props
```typescript
interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  glass?: boolean;
  glow?: boolean;
  padding?: number;
  noBorder?: boolean;
}
```

#### Features
- **Default**: Solid background with subtle shadow
- **Elevated**: Higher shadow, more depth
- **Glass**: Glassmorphism effect with blur
- **Glow**: Neon glow in dark mode

#### Usage
```jsx
<AppCard elevated glass glow padding={24}>
  <Text>Card Content</Text>
</AppCard>
```

---

### AppInput

#### Props
```typescript
interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  multiline?: boolean;
}
```

#### Sizes
| Size | Height | Font Size | Label Size |
|------|--------|-----------|------------|
| `sm` | 44px | 14px | 12px |
| `md` | 52px | 16px | 14px |
| `lg` | 60px | 18px | 16px |

#### Features
- Focus glow effect with purple border
- Error state with red glow
- Glassmorphism in dark mode
- Icon support (left/right)

#### Usage
```jsx
<AppInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  leftIcon={<Icon name="mail" />}
  size="md"
/>
```

---

## Gradient Specifications

### Primary Gradient (Navbar, Hero, Buttons)
```css
/* CSS */
background: linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #0EA5E9 100%);

/* React Native */
colors={['#7C3AED', '#6366F1', '#0EA5E9']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Button Gradient
```css
/* Light Mode */
background: linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%);

/* Dark Mode */
background: linear-gradient(135deg, #A78BFA 0%, #38BDF8 100%);
```

---

## Animation Guidelines

| Duration | Value | Usage |
|----------|-------|-------|
| Fast | 150ms | Micro-interactions, hover states |
| Normal | 300ms | Standard transitions, modals |
| Slow | 500ms | Page transitions, complex animations |

### Recommended Easings
- **Default**: `ease-in-out`
- **Enter**: `ease-out`
- **Exit**: `ease-in`
- **Spring**: For React Native Reanimated

---

## Usage in ThemeContext

### Accessing Theme
```jsx
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.textPrimary }}>
        Hello World
      </Text>
    </View>
  );
};
```

### Theme Properties Available
```javascript
const {
  theme,        // Current theme object (light or dark)
  themeMode,    // 'light' or 'dark'
  toggleTheme,  // Function to toggle theme
  setTheme,     // Function to set specific theme
  isLoading,    // Loading state while fetching saved theme
  isDark        // Boolean shorthand for dark mode check
} = useTheme();
```

---

## Best Practices

1. **Always use theme tokens** - Never hardcode colors
2. **Leverage shadows** - Use `theme.shadows.md` for standard elevation
3. **Use glassmorphism sparingly** - Reserve for prominent cards in dark mode
4. **Glow effects in dark mode** - Add `glow` prop for interactive elements
5. **Consistent spacing** - Use `theme.spacing` tokens
6. **Gradient buttons** - Primary CTAs should use gradient variant

---

## File Structure

```
src/
  context/
    ThemeContext.js      # Theme provider and definitions
  components/
    ui/
      AppButton.js       # Button component
      AppCard.js         # Card component
      AppInput.js        # Input component
```

---

## Version

- **Theme Version**: 2.0.0
- **Design System**: Cyberpunk Minimalism
- **Last Updated**: January 2026
