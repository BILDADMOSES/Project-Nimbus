export interface InviteMemberProps {
  emails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
  inviteLink: string;
  isOneOnOne: boolean;
  onSendInvitations: () => void;
}
