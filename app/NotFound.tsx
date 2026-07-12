import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {

  const navigate = useNavigate();

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-[#f8fafc]
        p-4
        sm:p-6
      "
    >

      <motion.div

        initial={{
          opacity:0,
          y:20
        }}

        animate={{
          opacity:1,
          y:0
        }}

        transition={{
          duration:0.5
        }}

        className="
          bg-white
          border
          border-slate-200
          rounded-3xl
          shadow-sm
          w-full
          max-w-2xl
          min-h-[520px]
          sm:min-h-[600px]
          flex
          flex-col
          items-center
          justify-center
          text-center
          px-5
          sm:px-10
          py-10
        "
      >


        {/* 404 */}

        <motion.h1

          animate={{
            scale:[1,1.03,1]
          }}

          transition={{
            duration:2,
            repeat:Infinity
          }}

          className="
            text-[80px]
            sm:text-[110px]
            md:text-[120px]
            leading-none
            font-black
            text-[#0f172a]
          "

        >
          404
        </motion.h1>



        {/* Title */}

        <h2
          className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-bold
            text-[#0f172a]
            mt-5
          "
        >
          Page Not Found
        </h2>



        {/* Description */}

        <p
          className="
            text-sm
            sm:text-base
            md:text-lg
            text-slate-500
            mt-4
            max-w-md
            leading-relaxed
          "
        >
          The resource or page you are trying to access does not exist in
          AssetFlow.
        </p>



        {/* Icon */}

        <motion.div

          animate={{
            y:[0,-6,0]
          }}

          transition={{
            duration:2,
            repeat:Infinity
          }}

          className="mt-8"

        >

          <div
            className="
              w-16
              h-16
              sm:w-20
              sm:h-20
              rounded-full
              bg-[#ccfbf1]
              flex
              items-center
              justify-center
            "
          >

            <Search
              size={32}
              className="sm:w-10 sm:h-10 text-[#0f766e]"
            />

          </div>

        </motion.div>




        {/* Buttons */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-3
            sm:gap-5
            mt-10
            w-full
            sm:w-auto
          "
        >

          <button

            onClick={()=>navigate(-1)}

            className="
              flex
              items-center
              justify-center
              gap-2
              px-6
              py-3
              rounded-xl
              border
              border-slate-300
              text-[#334155]
              text-sm
              sm:text-base
              hover:bg-slate-50
              transition
            "

          >

            <ArrowLeft size={18}/>
            Go Back

          </button>




          <button

            onClick={()=>navigate("/dashboard")}

            className="
              flex
              items-center
              justify-center
              gap-2
              px-6
              py-3
              rounded-xl
              bg-[#0f766e]
              text-white
              text-sm
              sm:text-base
              hover:bg-[#115e59]
              transition
              shadow-md
            "

          >

            <Home size={18}/>
            Dashboard

          </button>


        </div>



      </motion.div>


    </div>
  );
}
