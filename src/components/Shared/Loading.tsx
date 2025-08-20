import * as React from "react";

interface ILoadingProps {}

const Loading: React.FunctionComponent<ILoadingProps> = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      {/* Use public asset path (public/payer_time.ico) instead of importing a non-existent file */}
      <img src="/payer_time.ico" alt="loading" />
    </div>
  );
};

export default Loading;
