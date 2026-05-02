export const metadata = {
  title: "Delete Account - DropPR.ai",
  description: "Instructions on how to delete your account and data from DropPR.ai.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8">
            Account & Data Deletion
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Data Deletion Instructions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In compliance with Facebook Platform rules and applicable privacy laws, we provide instructions on how to delete your data. If you wish to delete your Drop PR account and all associated data, you can do so by following the instructions below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How to Delete Your Account</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can request the deletion of your account and data directly within our platform or by contacting our support team.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Method 1: Direct Deletion</h3>
              <ul className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
                <li>Log in to your Drop PR account.</li>
                <li>Navigate to your Account Settings or Profile page.</li>
                <li>Look for the "Delete Account" option.</li>
                <li>Confirm your decision to permanently delete your account and associated data.</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Method 2: Contact Support</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are unable to access your account or prefer us to handle the deletion, please send an email to our support team with the subject line <strong>"Account Deletion Request"</strong>. Please make sure to include the email address associated with your Drop PR account in the body of the email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. What Happens When You Delete Your Account</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you choose to delete your account, the following actions will occur:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Your personal profile information will be permanently removed.</li>
                <li>All uploaded videos, generated articles, and media content will be deleted from our active servers.</li>
                <li>Any data collected from third-party login providers (e.g., Facebook, Google) will be purged.</li>
                <li>Your active subscriptions will be canceled immediately.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <em>Note: Please allow up to 30 days for your data to be fully removed from our backup systems. We may retain certain information as required by law or for legitimate business purposes (such as financial records of past transactions).</em>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Removing Drop PR from Facebook Apps</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you logged in using Facebook and want to ensure no further interaction occurs between Facebook and Drop PR, you can also remove our app directly from your Facebook settings:
              </p>
              <ul className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
                <li>Go to your Facebook Account's Settings & Privacy.</li>
                <li>Click on "Settings" and navigate to "Apps and Websites".</li>
                <li>Find "Drop PR" in the list of active apps.</li>
                <li>Click "Remove" to revoke access.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
