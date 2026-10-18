"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { login } from "@/app/actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <motion.form
      action={action}
      className="login__card"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Techwitpro" width={160} height={20} className="login__logo" />
      <h1>Work library</h1>
      <p>Sign in with the team password to browse, share and present our work.</p>
      <input type="hidden" name="next" value={next} />
      <label className="field field--dark">
        <span>Team password</span>
        <div className="login__input">
          <Lock size={16} />
          <input name="password" type="password" autoComplete="current-password" required autoFocus />
        </div>
      </label>
      {state?.error && (
        <motion.p
          className="form-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
          transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
        >
          {state.error}
        </motion.p>
      )}
      <button className="btn btn--block" disabled={pending}>
        {pending ? <Loader2 size={17} className="spin" /> : null}
        Sign in {!pending && <ArrowRight size={17} />}
      </button>
    </motion.form>
  );
}
