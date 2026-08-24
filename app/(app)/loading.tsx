export default function Loading() {
  return <div className="animate-pulse space-y-6"><div className="h-10 w-56 rounded-xl bg-stone-200" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="h-28 rounded-2xl bg-stone-200" key={index} />)}</div><div className="h-96 rounded-2xl bg-stone-200" /></div>;
}
