function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-300"></div>
      <span className="text-gray-500 text-sm">أو</span>
      <div className="flex-1 h-px bg-gray-300"></div>
    </div>
  );
}

export default Divider;