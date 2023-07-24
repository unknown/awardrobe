import { Button } from "@ui/Button";

type DeleteNotificationButtonProps = {
  onNotificationDelete: () => void;
};

export function DeleteNotificationButton({ onNotificationDelete }: DeleteNotificationButtonProps) {
  return (
    <Button variant="destructiveOutline" onClick={onNotificationDelete}>
      Remove
    </Button>
  );
}
