import Button from '../../../components/ui/Button';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FDF8F0] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#F5E6D3]">
          <h3 className="text-lg font-semibold text-deep-teal">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full p-2"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 text-[#0e1b18]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;