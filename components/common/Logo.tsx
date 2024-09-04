import Image from "next/image";
import logosrc from "@/app/assets/img/logo.jpeg";

type LogoProps = {
  width: number;
  height: number;
  fontSize: string;
};

const Logo: React.FC<LogoProps> = ({ width, height, fontSize }) => {
  return (
    <div className="flex space-x-2 justify-start  items-center mx-auto">
      <Image src={logosrc} width={width} height={height} alt="Logo" />
      <h1 style={{ fontSize }} className="font">
        ChatEasy
      </h1>
    </div>
  );
};

export default Logo;
