import { motion } from "framer-motion";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <h1 className="text-2xl font-light">YC Founder&apos;s Chat</h1>
        <p className="text-justify text-muted-foreground">
          Explore and learn about Y Combinator founders through an intelligent
          chat interface. Our database contains information on ~7,500 YC-funded
          founders enriched with LinkedIn data including education, skills, and
          work experience.
        </p>
      </div>
    </motion.div>
  );
};
