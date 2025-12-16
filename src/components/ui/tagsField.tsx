"use client";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import TagsInput from "./tagsInput";

interface TagsFieldProps {
  name: string;
  defaultValue?: string[];
}

export const TagsField: FC<TagsFieldProps> = ({ name, defaultValue }) => {
  const { control, getValues, setValue } = useFormContext(); // Use the form context

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue || []}
      render={({ field: { onChange, onBlur, value } }) => (
        <TagsInput
          tags={value || []} // Normalize null/undefined to empty array
          setTags={onChange} // Pass the method to update the tags
          onBlur={onBlur} // Pass the onBlur method
        />
      )}
    />
  );
};

export default TagsField;
