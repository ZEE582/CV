import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import {loginWithGoogle,loginWithGithub,loginWithLinkedin,} from "../services/oauthService";
function SocialButtons() {
  return (
    <div className="grid grid-cols-3 gap-3" dir="ltr">
      <button onClick={loginWithGoogle}
        className="border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition"
      >
        <FcGoogle size={20} />
        <span className="text-sm font-medium text-gray-700">Google</span>
      </button>

      <button onClick={loginWithGithub}
        className="border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition"
    >
        <FaGithub size={20} />
        <span className="text-sm font-medium text-gray-700">GitHub</span>
      </button>

      <button onClick={loginWithLinkedin}
        className="border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition"
      >
        <FaLinkedin size={20} className="text-blue-600" />
        <span className="text-sm font-medium text-gray-700">LinkedIn</span>
      </button>
    </div>
  );
}

export default SocialButtons;