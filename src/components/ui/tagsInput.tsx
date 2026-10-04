// TagsInput.tsx
import { ChangeEvent, FC, KeyboardEvent, useState } from "react";
import { Icons } from "../layouts/icons";
import { Badge } from "./badge";
import { Input } from "./input";

interface TagsInputProps {
  tags?: string[] | null;
  setTags: (newTags: string[]) => void;
  onBlur: () => void;
  placeholder?: string;
}

const TagsInput: FC<TagsInputProps> = ({
  tags,
  setTags,
  onBlur,
  placeholder,
}) => {
  const [input, setInput] = useState<string>("");

  // Normalize tags to always be an array
  const normalizedTags = tags && Array.isArray(tags) ? tags : [];

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const addTag = () => {
    const tag = input.trim();
    if (tag && !normalizedTags.includes(tag)) {
      // Prevent adding duplicates and empty tags
      setTags([...normalizedTags, tag]);
    }
    setInput(""); // Clear input field after adding
  };

  const removeTag = (indexToRemove: number) => {
    setTags(normalizedTags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      addTag();
    }
  };

  // Phones often have no Enter key handy: leaving the field also adds what was typed
  const handleBlur = () => {
    addTag();
    onBlur();
  };

  return (
    <div className="relative flex flex-wrap items-center border border-input bg-background p-2 gap-x-3 gap-y-4 rounded-md">
      {normalizedTags.map((tag, index) => (
        <Badge key={index} className="rounded-full">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="text-white ml-1 -mr-1 p-1.5"
            aria-label={`Quitar ${tag}`}
          >
            <Icons.close height={12} width={12} />
          </button>
        </Badge>
      ))}

      <Input
        variant="ghost"
        className="h-6 mx-2 w-12 flex-grow"
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Escribe y pulsa Enter"}
        onBlur={handleBlur} // Notify React Hook Form on blur
      />
      <button
        type="button"
        onClick={addTag}
        aria-label="Agregar"
        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input text-muted-foreground"
      >
        <Icons.add className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TagsInput;
