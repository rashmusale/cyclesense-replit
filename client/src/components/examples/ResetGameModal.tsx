import { useState } from 'react';
import ResetGameModal from '../ResetGameModal';
import { Button } from '@/components/ui/button';

export default function ResetGameModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)} variant="destructive">
        Open Reset Modal
      </Button>
      <ResetGameModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={(keepTeams) => console.log('Reset game, keep teams:', keepTeams)}
      />
    </div>
  );
}
