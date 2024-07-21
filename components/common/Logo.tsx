import Image from "next/image";

type LogoProps = {
  width: number;
  height: number;
  fontSize: string;
  logoSrc: string;
};

const Logo: React.FC<LogoProps> = ({ width, height, fontSize, logoSrc }) => {
  return (
    <div className="flex space-x-5 justify-center  items-center mx-auto">
      <h1 style={{ fontSize }} className="font-black">
        chatEasy
      </h1>
      <Image src={logoSrc} width={width} height={height} alt="Logo" />
    </div>
  );
};

export default Logo;
