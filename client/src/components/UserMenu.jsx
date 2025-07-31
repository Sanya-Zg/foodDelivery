import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Divider from './Divider';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { logout } from '../store/userSlice';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';

const UserMenu = ({ close }) => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.logout,
      });
      console.log(response);
      if (response.data.success) {
        close();
        dispatch(logout());
        localStorage.clear();
        toast.success(response.data.message);
      }
    } catch (error) {
      AxiosToastError();
    }
  };

  return (
    <div>
      <div className="font-semibold">My Account</div>
      <div className="text-sm">{user.name || user.mobile}</div>

      <Divider />

      <div className="text-sm grid gap-1">
        <Link to={''} className="px-2 hover:bg-orange-200 py-1">
          My Orders
        </Link>
        <Link to={''} className="px-2 hover:bg-orange-200 py-1">
          Save Address
        </Link>
        <button
          onClick={handleLogout}
          className="text-left px-2 hover:bg-orange-200 py-1"
        >
          Log out
        </button>
      </div>
    </div>
  );
};
export default UserMenu;
