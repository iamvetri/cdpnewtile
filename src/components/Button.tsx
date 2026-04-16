import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'toast' | 'cta';

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button: React.FC<IButtonProps> = ({ variant = 'primary', style, children, className, ...props }) => {
  let baseStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: props.disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    transition: "all 0.2s ease-in-out",
    ...style
  };

  switch (variant) {
    case 'primary':
      baseStyle = {
        ...baseStyle,
        background: props.disabled ? "#9ca3af" : "#2d678f",
        color: "#fff"
      };
      break;
    case 'secondary':
      baseStyle = {
        ...baseStyle,
        background: props.disabled ? "#f3f4f6" : "#fff",
        color: props.disabled ? "#9ca3af" : "#374151",
        border: "1px solid #d1d5db"
      };
      break;
    case 'quiet':
      baseStyle = {
        ...baseStyle,
        background: "transparent",
        color: props.disabled ? "#9ca3af" : "#2d678f",
      };
      break;
    case 'toast':
      baseStyle = {
        ...baseStyle,
        background: "transparent",
        color: "#fff",
        border: "1px solid #fff",
        borderRadius: "4px",
        padding: "4px 8px"
      };
      break;
    case 'cta':
      baseStyle = {
        ...baseStyle,
        background: props.disabled ? "#9ca3af" : "#2d678f",
        color: "#fff",
      };
      break;
  }

  // Preserve any className passed down
  let combinedClassName = className ? ` ${className}` : "";
  if (variant === 'quiet') combinedClassName = `button button--quiet${combinedClassName}`;
  if (variant === 'cta') combinedClassName = `button button--cta${combinedClassName}`;

  return (
    <button style={baseStyle} className={combinedClassName.trim() || undefined} {...props}>
      {children}
    </button>
  );
};

export default Button;
