import buttonImage from "../../assets/images/button.png";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export default function Button({ onClick, children }: ButtonProps) {
  return (
    <div
      className="button-container"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <img
        src={buttonImage}
        alt={typeof children === "string" ? children : "Button"}
        className="button"
      />
      <span className="button-text">{children}</span>
    </div>
  );
}
