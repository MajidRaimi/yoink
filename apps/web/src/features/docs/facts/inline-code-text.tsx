import { Fragment } from "react";

export type InlineCodeTextProps = {
  text: string;
};

const HTTP_URL = /^https?:\/\/\S+$/;

export const InlineCodeText = ({ text }: InlineCodeTextProps): React.JSX.Element => {
  if (HTTP_URL.test(text)) {
    return (
      <a href={text}>
        <bdi>{text}</bdi>
      </a>
    );
  }
  return (
    <>
      {text.split("`").map((part, index) =>
        index % 2 === 1 ? (
          <code key={index}>
            <bdi>{part}</bdi>
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
};
