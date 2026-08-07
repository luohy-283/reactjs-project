import { Button } from "primereact/button";
import { ConfirmPopconfirm } from "@/components/ui/dialog/ConfirmPopconfirm";
import { DeleteButton } from "@/components/ui/button/DeleteButton";
import { TableRowActions } from "@/components/ui/table/TableRowActions";

type ConfirmCopy = {
  title: string;
  description?: string;
};

type Props = {
  loading?: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveText?: string;
  rejectText?: string;
  /** When set, wrap Duyệt in ConfirmPopconfirm. */
  approveConfirm?: ConfirmCopy;
  /** When set, wrap Từ chối in ConfirmPopconfirm. */
  rejectConfirm?: ConfirmCopy;
};

/** Shared Duyệt / Từ chối row actions for pending-request tables. */
export function ApproveRejectActions({
  loading,
  onApprove,
  onReject,
  approveText = "Duyệt",
  rejectText = "Từ chối",
  approveConfirm,
  rejectConfirm,
}: Props) {
  const approveBtn = (
    <Button
      type="button"
      label={approveText}
      size="small"
      loading={loading}
      onClick={onApprove}
    />
  );
  const rejectBtn = (
    <DeleteButton loading={loading} onClick={onReject}>
      {rejectText}
    </DeleteButton>
  );

  return (
    <TableRowActions>
      {approveConfirm ? (
        <ConfirmPopconfirm
          title={approveConfirm.title}
          description={approveConfirm.description}
          onConfirm={onApprove}
          okText={approveText}
        >
          <Button type="button" label={approveText} size="small" loading={loading} />
        </ConfirmPopconfirm>
      ) : (
        approveBtn
      )}
      {rejectConfirm ? (
        <ConfirmPopconfirm
          title={rejectConfirm.title}
          description={rejectConfirm.description}
          onConfirm={onReject}
          okText={rejectText}
          okButtonProps={{ danger: true }}
        >
          <DeleteButton loading={loading}>{rejectText}</DeleteButton>
        </ConfirmPopconfirm>
      ) : (
        rejectBtn
      )}
    </TableRowActions>
  );
}
