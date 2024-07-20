import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value }) => {
  return (
    <div className="mb-6 flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-4">Scan QR Code to Join</h2>
      <div className="p-4 bg-primary rounded-lg shadow-md">
        <QRCode
          value={value}
          size={200}
          level="H"
          includeMargin={true}
          bgColor="transparent"
          fgColor="#ffffff"
        />
      </div>
      <p className="mt-4 text-center text-sm text-base-content">
        Scan this QR code with a mobile device to join the chat instantly.
      </p>
    </div>
  );
};