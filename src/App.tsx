import { useState } from 'react';
import type { Descendant } from 'slate';
import RichText from './components/RichText';

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Привет! Это standalone-стенд RichText.' }],
  } as Descendant,
];

function App() {
  const [value, setValue] = useState<Descendant[]>(initialValue);

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 md:p-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">RichText Playground</h1>
      <p className="mb-6 text-sm text-slate-600">
        Редактор ниже повторяет базовую функциональность вашего компонента на Slate.
      </p>

      <RichText value={value} onChange={setValue} />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">JSON результата</h2>
        <pre className="max-h-64 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(value, null, 2)}
        </pre>
      </section>
    </main>
  );
}

export default App;
