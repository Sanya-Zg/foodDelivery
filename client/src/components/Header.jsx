import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Search from './Search';
import { FaRegCircleUser } from 'react-icons/fa6';
import { IoCartOutline } from 'react-icons/io5';
import useMobile from '../hooks/useMobile';

const Header = () => {
  const [isMobile] = useMobile();
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';
  const navigate = useNavigate();

  const redirectToLoginPage = () => {
    navigate('/login');
  }
  return (
    <header className="h-24 lg:h-20 lg:shadow-md sticky top-0 flex flex-col justify-center gap-1">
      {!(isSearchPage && isMobile) && (
        <div className="container mx-auto flex items-center justify-between px-2">
          {/* logo */}
          <div>
            <Link to={'/'} className="h-full flex justify-center items-center">
              <img
                src={logo}
                width={170}
                height={60}
                className="hidden lg:block"
                alt="logo"
              />
              <img
                src={logo}
                width={120}
                height={60}
                className="lg:hidden"
                alt="logo"
              />
            </Link>
          </div>
          {/* search */}
          <div className="hidden lg:block">
            <Search />
          </div>

          {/* login and cart */}
          <div>
            <button className="text-neutral-600 lg:hidden">
              <FaRegCircleUser size={26} />
            </button>
            <div className="hidden lg:flex items-center gap-10">
              <button onClick={redirectToLoginPage} className='text-lg px-2'>Login</button>
              <button className="flex items-center gap-2 bg-green-800 hover:bg-green-700 px-3 py-3 rounded text-white">
                <div className='animate-bounce'>
                  <IoCartOutline size={26} />
                </div>
                <div className='font-semibold'>
                  <p>My Cart</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-2 lg:hidden">
        <Search />
      </div>
    </header>
  );
};
export default Header;
