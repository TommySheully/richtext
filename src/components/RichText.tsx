import { MouseEvent, useCallback, useMemo, useState } from 'react';
import isHotkey from 'is-hotkey';
import {
  BaseEditor,
  Descendant,
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
} from 'slate';
import { HistoryEditor, withHistory } from 'slate-history';
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact,
} from 'slate-react';

type RichTextEditor = BaseEditor & ReactEditor & HistoryEditor;
type MarkFormat = 'bold' | 'italic' | 'underline' | 'code';
type BlockFormat =
  | 'heading-one'
  | 'heading-two'
  | 'block-quote'
  | 'numbered-list'
  | 'bulleted-list'
  | 'left'
  | 'center'
  | 'right'
  | 'justify';

const HOTKEYS: Record<string, MarkFormat> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  } as Descendant,
];

interface RichTextProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
}

function isMarkActive(editor: Editor, format: MarkFormat) {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
}

function toggleMark(editor: Editor, format: MarkFormat) {
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function isBlockActive(editor: Editor, format: BlockFormat, blockType = 'type') {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (n as any)[blockType] === format,
    }),
  );

  return !!match;
}

function toggleBlock(editor: Editor, format: BlockFormat) {
  const isActive = isBlockActive(editor, format, ALIGN_TYPES.includes(format) ? 'align' : 'type');
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      LIST_TYPES.includes((n as any).type) &&
      !ALIGN_TYPES.includes(format),
    split: true,
  });

  const newProperties = ALIGN_TYPES.includes(format)
    ? { align: isActive ? undefined : format }
    : { type: isActive ? 'paragraph' : isList ? 'list-item' : format };

  Transforms.setNodes(editor, newProperties as Partial<SlateElement>);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
}

function Element({ attributes, children, element }: RenderElementProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = { textAlign: (element as any).align };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switch ((element as any).type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 className="text-3xl font-bold" style={style} {...attributes}>
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 className="text-2xl font-semibold" style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
}

function Leaf({ attributes, children, leaf }: RenderLeafProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((leaf as any).bold) children = <strong>{children}</strong>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((leaf as any).code) children = <code>{children}</code>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((leaf as any).italic) children = <em>{children}</em>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((leaf as any).underline) children = <u>{children}</u>;
  return <span {...attributes}>{children}</span>;
}

function ToolbarButton({
  active,
  label,
  onMouseDown,
  disabled = false,
}: {
  active?: boolean;
  label: string;
  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={onMouseDown}
      className={`rounded border px-2 py-1 text-xs font-medium transition ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
          : active
            ? 'border-blue-500 bg-blue-100 text-blue-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
      }`}>
      {label}
    </button>
  );
}

function MarkButton({ format, label }: { format: MarkFormat; label: string }) {
  const editor = useSlate();
  return (
    <ToolbarButton
      label={label}
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    />
  );
}

function BlockButton({ format, label }: { format: BlockFormat; label: string }) {
  const editor = useSlate();
  return (
    <ToolbarButton
      label={label}
      active={isBlockActive(editor, format, ALIGN_TYPES.includes(format) ? 'align' : 'type')}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    />
  );
}

export default function RichText({ value, onChange, placeholder = 'Введите текст...' }: RichTextProps) {
  const [isFocused, setIsFocused] = useState(false);
  const editor = useMemo(() => withHistory(withReact(createEditor())) as RichTextEditor, []);
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border-2 bg-white transition ${
        isFocused ? 'border-slate-300' : 'border-slate-200'
      }`}>
      <Slate editor={editor} initialValue={value.length ? value : initialValue} onChange={onChange}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
          <MarkButton format="bold" label="Bold" />
          <MarkButton format="italic" label="Italic" />
          <MarkButton format="underline" label="Underline" />
          <MarkButton format="code" label="Code" />
          <BlockButton format="heading-one" label="H1" />
          <BlockButton format="heading-two" label="H2" />
          <BlockButton format="block-quote" label="Quote" />
          <BlockButton format="numbered-list" label="1." />
          <BlockButton format="bulleted-list" label="•" />
          <BlockButton format="left" label="Left" />
          <BlockButton format="center" label="Center" />
          <BlockButton format="right" label="Right" />
          <BlockButton format="justify" label="Justify" />
          <ToolbarButton
            label="Undo"
            disabled={!editor.history.undos.length}
            onMouseDown={(event) => {
              event.preventDefault();
              editor.undo();
            }}
          />
          <ToolbarButton
            label="Redo"
            disabled={!editor.history.redos.length}
            onMouseDown={(event) => {
              event.preventDefault();
              editor.redo();
            }}
          />
        </div>
        <Editable
          className="min-h-48 p-4 outline-none"
          placeholder={placeholder}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(event) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event as never)) {
                event.preventDefault();
                toggleMark(editor, HOTKEYS[hotkey]);
              }
            }
          }}
        />
      </Slate>
    </div>
  );
}
