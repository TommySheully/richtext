# RichText Standalone

Небольшой изолированный стенд для тестирования компонента `RichText` на базе `Slate` + `Tailwind`.

## Быстрый старт

1. Перейдите в папку:

```bash
cd richtext-standalone
```

2. Установите зависимости:

```bash
yarn
```

3. Запустите проект:

```bash
yarn start
```

По умолчанию Vite поднимет сервер на `http://localhost:5173`.

## Что внутри

- `src/components/RichText.tsx` — сам редактор с toolbar, hotkeys и undo/redo.
- `src/App.tsx` — демо-страница и вывод текущего значения в JSON.
- `src/index.css` — Tailwind + базовые стили для списков и `blockquote` в Slate.

## Поддерживаемые возможности

- Marks: **bold**, *italic*, `code`, underline.
- Blocks: `h1`, `h2`, `blockquote`, `numbered-list`, `bulleted-list`.
- Выравнивание: `left`, `center`, `right`, `justify`.
- Горячие клавиши: `Cmd/Ctrl + B`, `Cmd/Ctrl + I`, `Cmd/Ctrl + U`, `Cmd/Ctrl + \``.
- История: undo / redo.

## Формат данных

Компонент работает с массивом Slate-нод (`Descendant[]`), пример:

```ts
[
  {
    type: 'paragraph',
    children: [{ text: 'Пример текста' }],
  },
];
```

## Как перенести в другой проект

1. Скопируйте `src/components/RichText.tsx`.
2. Подключите зависимости из `package.json` (`slate`, `slate-react`, `slate-history`, `is-hotkey`).
3. Передавайте в компонент:
   - `value: Descendant[]`
   - `onChange: (value: Descendant[]) => void`

