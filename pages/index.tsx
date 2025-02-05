import type { NextPage } from "next";
import MenuBar from "./menubar";
import MainBody from "./mainbody";
import Footer from "./footer";

const Home: NextPage = () => {
  return (
    <div>
      <MenuBar />
      <MainBody />
      <Footer />
    </div>
  );
};

export default Home;
