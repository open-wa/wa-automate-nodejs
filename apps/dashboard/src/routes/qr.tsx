import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/qr')({
  component: QRPage,
})

function QRPage() {
  const [qr, setQR] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:8080/qr')
      .then(r => r.json())
      .then(data => setQR(data.qr));
  }, []);

  return (
    <div>
      <h1>Scan QR Code</h1>
      {qr && <img src={qr} alt="QR Code" />}
    </div>
  );
}
