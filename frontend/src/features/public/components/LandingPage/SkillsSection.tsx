const skills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Docker',
  'AWS', 'Git', 'SQL', 'GraphQL', 'System Design', 'DSA',
  'Apache Spark', 'Apache Kafka', 'Kubernetes', 'Terraform',
  'PyTorch / TensorFlow', 'Hugging Face', 'Three.js / WebGL',
  'Framer Motion', 'Tailwind CSS', 'Solidity / Web3.js',
  'CI/CD', 'Linux / Shell', 'MongoDB / Redis', 'MLOps',
]

export default function SkillsSection() {
  return (
    <div className="py-10 text-center">
      <p className="text-base font-[Bitcount Grid Single, system-ui] text-indigo-600 mb-8">
        تقنيات المسار
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
        {skills.map((skill) => (
          <span key={skill}
            className="bg-white border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full text-xs
              hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 hover:scale-105 transition-all duration-300 cursor-default">
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}
