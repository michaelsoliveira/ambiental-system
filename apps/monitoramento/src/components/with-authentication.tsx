// import PropTypes from 'prop-types'
import { auth } from '@/lib/auth';
import { redirect } from "next/navigation";

const withAuthentication = async (WrappedComponent: any) => {

    const session = await auth();
    const RequiresAuthentication = (props: any) => {
      // const router = useRouter()
      
        // if (typeof session !== typeof undefined) {
            // if (status !== 'authenticated') {
        if (!session) {
              return redirect(`/?callbackUrl=${encodeURI(window.location.pathname)}`)
            // }
        }
      
     // if there's a loggedInUser, show the wrapped page, otherwise show a loading indicator
      return session && <WrappedComponent {...props} />

  };

  return RequiresAuthentication;
};

// withAuthentication.propTypes = {
//   WrappedComponent: PropTypes.node.isRequired
// };

export default withAuthentication;