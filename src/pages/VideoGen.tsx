import { motion } from 'motion/react';

export default function VideoGen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 h-full flex flex-col"
    >
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
          视频生成 (Video Generation)
        </h1>
        <p className="text-neutral-400">原子能力测试 - 文本/图像生成视频</p>
      </div>
      <div className="flex-1 flex items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-3xl">
        视频生成功能开发中...
      </div>
    </motion.div>
  );
}
