import Image from "next/image";
import LoginForm from "./LoginForm";

const LoginPage = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <div className="bg-white p-12 rounded-md shadow-2xl flex flex-col gap-2">
        <h1 className="text-2xl flex items-center gap-0">
          <Image
            src="/logo.png"
            alt="logo"
            width={120}
            height={120}
            className="mr-[-10px]"
          />
          <span className="text-3xl font-semibold">EduNova</span>
        </h1>
        <h2 className="text-gray-400">Sign in to your account</h2>

        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
