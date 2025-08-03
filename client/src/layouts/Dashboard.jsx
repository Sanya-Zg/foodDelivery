import { Outlet } from "react-router-dom"
import UserMenu from "../components/UserMenu"

const Dashboard = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto p-3 grid lg:grid-cols-[250px,1fr]">
        <div className="py-4 sticky top-24 overflow-y-auto hidden lg:block">
          <UserMenu />
        </div>
        <div className="bg-white p-4">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
export default Dashboard