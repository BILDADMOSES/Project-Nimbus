import Image from "next/image";
import logosrc from "@/app/assets/img/icon.svg";

type LogoProps = {
  width: number;
  height: number;
  fontSize: string;
};

const Logo: React.FC<LogoProps> = ({ width, height, fontSize }) => {
  return (
    <div className="flex space-x-5 justify-center  items-center mx-auto">
      <h1 style={{ fontSize }} className="font-black">
        chatEasy
      </h1>
      <Image src={logosrc} width={width} height={height} alt="Logo" />
    </div>
  );
};

export default Logo;