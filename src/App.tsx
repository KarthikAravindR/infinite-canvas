import React from 'react'
import styles from "./App.module.css";

interface ReactInfiniteCanvasProps {
  children: JSX.Element;
}

const ReactInfiniteCanvas: React.FC<ReactInfiniteCanvasProps> = ({ children }) => {
  return <div className={styles.wrapper}>{children}</div>;
};

export { ReactInfiniteCanvas };
