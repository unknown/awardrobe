import { useState } from "react";
import { Button, ButtonProps } from "@ui/Button";

type DeleteNotificationButtonProps = ButtonProps & {
  onNotificationDelete: () => Promise<boolean>;
};

export function DeleteNotificationButton({
  onNotificationDelete,
  ...props
}: DeleteNotificationButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      {...props}
      variant="destructiveOutline"
      onClick={async () => {
        setLoading(true);
        await onNotificationDelete();
        setLoading(false);
      }}
      disabled={loading}
    >
      Remove
    </Button>
  );
}
