// components/Toast.tsx

type ToastProps = {
  message: string;
  variant: "success" | "error" | "warning" | "info";
};

const variantClasses = {
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
  info: "alert-info",
};

const Toast: React.FC<ToastProps> = ({ message, variant }) => {
  return (
    <div className="toast toast-top toast-end">
      <div className={`alert ${variantClasses[variant]} shadow-lg`}>
        <div>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default Toast;
