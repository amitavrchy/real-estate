export const metadata = { title: "Your privacy" };
export default function Page() {
  return (
    <div className="container legal-page">
      <p className="eyebrow">A CONSIDERED APPROACH TO YOUR INFORMATION</p>
      <h1>Your privacy.</h1>
      <p>
        Haven is a demonstration real estate marketplace. This notice describes
        the data the application stores when you use it.
      </p>
      <h2>What you share</h2>
      <p>
        We store your name, email address, a securely hashed password, saved
        homes, saved searches, collections and notes, and messages you send to
        property advisors. If you request an illustrative valuation, we store
        the address, living area, contact details, and calculated range.
        Newsletter signups store your email address.
      </p>
      <h2>Who can see it</h2>
      <p>
        Your collections, saved searches, and saved homes belong to your
        account. Listing advisors can see inquiries about their own residences.
        Administrators can manage listings, journal stories, inquiries, and
        seller introductions. Contact details in inquiries are shared with the
        listing advisor and administrators.
      </p>
      <h2>Session and browser storage</h2>
      <p>
        Your sign-in token is stored in session storage in your browser tab.
        Signing out removes it from that tab. Tokens expire after eight hours.
        This application does not install advertising or analytics trackers.
      </p>
      <h2>Your choices</h2>
      <p>
        You can remove saved homes, saved searches, collections, and collection
        notes in your account. For other data questions or deletion requests,
        contact the operator of this demonstration application. No automatic
        newsletter delivery is enabled.
      </p>
      <h2>Third-party services</h2>
      <p>
        Maps load tiles from OpenStreetMap. External media may load from the URL
        supplied by a listing advisor. Those providers receive standard
        connection information when your browser requests their content. Virtual
        tours, when provided, are hosted by their respective providers.
      </p>
      <h2>Contact</h2>
      <p>
        The haven.example addresses and 555 phone numbers in this demonstration
        are illustrative. For support or privacy requests, contact the person or
        organization that provided this application.
      </p>
    </div>
  );
}
