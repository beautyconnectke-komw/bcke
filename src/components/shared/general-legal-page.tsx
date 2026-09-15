import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

type LegalKind = "terms" | "privacy";

const LAST_UPDATED = "14 September 2026";

const termsContents = [
  { id: "terms-general", label: "General terms" },
  { id: "terms-employers", label: "Employer section" },
  { id: "terms-workers", label: "Worker section" },
];

const privacyContents = [
  { id: "privacy-general", label: "General privacy" },
  { id: "privacy-employers", label: "Employer privacy" },
  { id: "privacy-workers", label: "Worker privacy" },
];

export function GeneralLegalPage({ kind }: { kind: LegalKind }) {
  const isTerms = kind === "terms";
  const title = isTerms ? "Terms & Conditions" : "Privacy Policy";
  const Icon = isTerms ? FileText : ShieldCheck;
  const contents = isTerms ? termsContents : privacyContents;

  return (
    <main className="legal-shell min-h-svh bg-[#f4f6f2] text-[#17221d] print:bg-white">
      <div className="mx-auto max-w-[1180px] px-5 py-5 sm:px-8 sm:py-8 print:max-w-none print:px-0 print:py-0">
        <header className="legal-site-header flex items-center justify-between border-b border-[#dbe4dc] pb-5 print:hidden">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[#123f31] text-[#f4e7ff] shadow-[0_8px_20px_rgba(18,63,49,0.16)]">
              <span className="size-2.5 rounded-full bg-[#cdb5f5]" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#123f31]">
              Beauty Connect
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-[#587065]">
            <Link className="transition hover:text-[#123f31]" href="/terms">
              Terms
            </Link>
            <Link className="transition hover:text-[#123f31]" href="/privacy">
              Privacy
            </Link>
            <Link
              className="hidden items-center gap-1.5 rounded-full border border-[#cfdcd1] bg-white px-3.5 py-2 text-[#123f31] transition hover:border-[#123f31] sm:inline-flex"
              href="/"
            >
              Back home <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </header>

        <article className="legal-document mt-8 sm:mt-12 print:mt-0">
          <div className="legal-document-header px-6 pb-9 pt-7 sm:px-12 sm:pb-12 sm:pt-11 print:px-0 print:pb-8 print:pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6c5a97]">
                <Icon className="size-3.5" />
                <span>Beauty Connect</span>
                <span className="text-[#b1bcb3]">/</span>
                <span>Kenya</span>
              </div>
              <span className="hidden rounded-full bg-[#edf4ee] px-3 py-1.5 text-[11px] font-semibold text-[#38644f] sm:inline-flex">
                Master document
              </span>
            </div>

            <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-[#557064]">
                  General · Employer · Worker
                </p>
                <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-[#123f31] sm:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-2xl text-[17px] leading-8 text-[#53645b]">
                  {isTerms
                    ? "The rules for using Beauty Connect to discover, evaluate and connect with beauty professionals and beauty businesses."
                    : "How Beauty Connect collects, uses, shares and protects personal data across the marketplace."}
                </p>
              </div>

              <div className="legal-meta-card rounded-2xl border border-[#dfe8df] bg-[#f7faf7] p-5 text-sm">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <MetaItem label="Effective date" value={LAST_UPDATED} />
                  <MetaItem label="Last updated" value={LAST_UPDATED} />
                  <MetaItem
                    label="Applies to"
                    value="Workers, Employers and visitors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="legal-document-rule mx-6 border-t border-[#e4ebe5] sm:mx-12 print:mx-0" />

          <div className="grid gap-10 px-6 py-9 sm:px-12 sm:py-12 lg:grid-cols-[190px_minmax(0,1fr)] print:grid-cols-1 print:px-0 print:py-8">
            <aside className="legal-contents print:hidden lg:sticky lg:top-6 lg:self-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#809087]">
                Contents
              </p>
              <nav className="mt-4 grid gap-2 border-l border-[#d7e2d9] pl-4">
                {contents.map((item, index) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="group flex gap-2 text-sm leading-6 text-[#60736a] transition hover:text-[#123f31]"
                  >
                    <span className="font-mono text-[11px] text-[#9baaa0] group-hover:text-[#6c5a97]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
              <div className="mt-8 rounded-2xl bg-[#f2effa] p-4 text-xs leading-5 text-[#625b71]">
                One canonical document. Role-specific rules appear in the
                relevant section below.
              </div>
            </aside>

            <div className="legal-body min-w-0">
              {isTerms ? <TermsContent /> : <PrivacyContent />}
            </div>
          </div>

          <footer className="legal-document-footer border-t border-[#e4ebe5] bg-[#fbfcfa] px-6 py-6 sm:px-12 print:mx-0 print:px-0">
            <div className="flex flex-col gap-4 text-xs leading-5 text-[#708078] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Beauty Connect ·{" "}
                {isTerms ? "Terms & Conditions" : "Privacy Policy"}
              </p>
              <p>Last updated {LAST_UPDATED}</p>
            </div>
          </footer>
        </article>

        <div className="mt-6 flex justify-center print:hidden">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#37614f] transition hover:text-[#123f31]"
          >
            <ArrowLeft className="size-4" /> Return to sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#82928a]">
        {label}
      </p>
      <p className="mt-1.5 font-medium leading-5 text-[#284638]">{value}</p>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="legal-copy">
      <IntroNote>
        These Terms &amp; Conditions govern access to and use of the Beauty
        Connect website, application, marketplace, profiles, account services
        and related features (together, the “Platform”). By creating an account,
        accessing the Platform or using any part of it, you agree to these
        Terms. If you do not agree, do not create an account or use the
        Platform.
      </IntroNote>

      <LegalGroup id="terms-general" number="01" title="General terms">
        <LegalSection number="1" title="About Beauty Connect">
          <p>
            Beauty Connect is a marketplace that helps beauty professionals and
            beauty businesses discover one another and explore potential
            professional opportunities.
          </p>
          <DefinitionList
            items={[
              [
                "Worker",
                "a beauty professional using the Platform to present their skills, experience, portfolio or professional profile.",
              ],
              [
                "Employer",
                "a salon, beauty business or authorised person operating on behalf of such a business.",
              ],
              ["User", "a Worker or Employer."],
              [
                "Beauty Connect, we, us or our",
                "the operator of the Platform. The legal entity operating the brand will be identified in the contact details once confirmed.",
              ],
            ]}
          />
          <p>
            Beauty Connect is a connecting platform. It is not the employer of
            Workers, is not the employee of Employers, and is not a party to any
            employment, freelance, contractor, appointment or other professional
            relationship formed between Users merely because the relationship
            began through the Platform.
          </p>
        </LegalSection>

        <LegalSection number="2" title="Acceptance and eligibility">
          <p>By using Beauty Connect, you confirm that:</p>
          <BulletList
            items={[
              "you have read and understood these Terms and the Privacy Policy;",
              "you are at least 18 years old and legally capable of entering into an agreement under applicable Kenyan law;",
              "you satisfy the eligibility requirements for your selected role; and",
              "the information you provide is truthful, accurate, complete and not materially misleading.",
            ]}
          />
          <p>
            Beauty Connect is intended for adults. You must not create or
            operate an account for a person under 18, or help another person
            bypass this requirement. We may request reasonable information or
            documentation where reasonably necessary to establish eligibility,
            authenticity, professional information or compliance with these
            Terms.
          </p>
        </LegalSection>

        <LegalSection number="3" title="Accounts and security">
          <p>
            You must provide information that is accurate, complete and
            reasonably current when you create and maintain an account. This may
            include your name, email address, telephone number, location,
            professional or business information, profile photographs, portfolio
            material, experience and services.
          </p>
          <BulletList
            items={[
              "Do not impersonate another person or business, use another person's identity without authority, or create deceptive duplicate accounts.",
              "Keep your sign-in credentials and devices reasonably secure.",
              "Notify Beauty Connect promptly if you reasonably believe your account or credentials have been compromised.",
              "You are responsible for activity carried out through your account, subject to applicable law and circumstances outside your reasonable control.",
            ]}
          />
        </LegalSection>

        <LegalSection number="4" title="Honest and lawful use">
          <p>
            Beauty Connect is a professional marketplace. You agree to use it
            honestly, lawfully, respectfully and only for legitimate purposes
            connected with the Platform or a potential professional
            relationship.
          </p>
          <p>You must not:</p>
          <BulletList
            items={[
              "deceive, defraud, harass, threaten, abuse or intimidate another person;",
              "submit false professional qualifications, experience, business information or availability;",
              "misuse, publish, sell or distribute another User's personal or contact information;",
              "send unsolicited, abusive, automated or deceptive communications or requests;",
              "scrape, harvest or systematically collect Platform information without our permission;",
              "attempt unauthorised access, interfere with Platform security, reverse engineer or bypass safety controls except where permitted by law;",
              "upload malware, unlawful content or content that infringes another person's rights; or",
              "use the Platform in a way that creates unreasonable risk to Users or Beauty Connect.",
            ]}
          />
        </LegalSection>

        <LegalSection number="5" title="Information and content you submit">
          <p>
            You remain responsible for information, photographs, portfolio
            material, business descriptions and other content you submit. You
            must have the rights and permissions needed to upload and display
            that content, including permission from identifiable people shown in
            an image where such permission is required.
          </p>
          <p>
            You retain ownership rights you have in content you lawfully submit.
            You grant Beauty Connect a non-exclusive, worldwide, royalty-free
            licence to host, store, reproduce, display and use that content only
            to the extent reasonably necessary to operate, secure, improve and
            provide the Platform, including displaying your profile as intended.
          </p>
          <p>
            This licence does not transfer ownership to Beauty Connect. We may
            remove, restrict or decline to display content where a rights,
            privacy, safety, authenticity or Terms concern is raised or where
            removal is otherwise reasonably necessary.
          </p>
        </LegalSection>

        <LegalSection
          number="6"
          title="What Beauty Connect does—and does not—promise"
        >
          <p>
            We provide profiles, discovery tools, requests, connection workflows
            and related technology intended to help Users find one another. We
            may review Worker applications, moderate content, investigate
            suspected misuse, restrict accounts and improve the Platform.
          </p>
          <p>
            We do not promise that any User is genuine, suitable, qualified,
            available, safe or successful; that any information will always be
            accurate; that a Worker will be hired or an Employer will hire; that
            a connection will lead to employment, income or any particular
            outcome; or that a professional relationship will continue after
            Users connect.
          </p>
        </LegalSection>

        <LegalSection number="7" title="Visibility, requests and the handshake">
          <HandshakeCallout />
          <p>
            Before a handshake, the Platform is designed to show discovery
            information appropriate to the User&apos;s role, such as a Worker’s
            name, location, experience, skills and portfolio, or an Employer’s
            business name, location, services and salon images. Private phone
            numbers and email addresses are not ordinarily disclosed to the
            other party before the relevant handshake.
          </p>
          <p>
            A request, response or acceptance is not itself an employment
            agreement, engagement contract or promise to hire. Users must not
            attempt to circumvent Platform controls to obtain information that
            Beauty Connect has not made available to them.
          </p>
        </LegalSection>

        <LegalSection
          number="8"
          title="Professional relationship after a handshake"
        >
          <p>
            After a handshake, the parties may communicate directly using the
            contact information disclosed through the Platform. Any resulting
            employment, freelance engagement, contract, appointment, payment
            arrangement, schedule, working condition or other professional
            arrangement is between the relevant Users unless Beauty Connect
            expressly states otherwise.
          </p>
          <p>
            Users are responsible for deciding whether to proceed, checking
            suitability and identity, agreeing terms, and complying with
            applicable Kenyan law. Beauty Connect is not responsible for
            representations, payments, working conditions, disputes, conduct or
            performance arising outside the Platform, to the extent that this
            can lawfully be excluded.
          </p>
        </LegalSection>

        <LegalSection number="9" title="Review, moderation and enforcement">
          <p>
            Beauty Connect may, where reasonably necessary and subject to
            applicable law, reject an application, request information or
            verification, remove content, remove a profile from marketplace
            discovery, restrict contact features, suspend an account or
            terminate access.
          </p>
          <p>Reasons may include:</p>
          <BulletList
            items={[
              "breach of these Terms or the Privacy Policy;",
              "suspected fraud, impersonation or materially false information;",
              "misuse of personal data, harassment, abuse or unlawful conduct;",
              "security concerns or attempts to circumvent Platform safeguards;",
              "repeated complaints or conduct that presents a significant risk to Users or the Platform.",
            ]}
          />
          <p>
            We may give notice or an opportunity to respond where appropriate,
            but this may not be possible where immediate action is reasonably
            necessary for security, fraud prevention, legal compliance or
            protection of Users.
          </p>
        </LegalSection>

        <LegalSection number="10" title="Deactivation, deletion and retention">
          <p>
            Deactivation or a freeze and deletion are different actions. A
            deactivated account may be removed from marketplace discovery while
            information is retained to preserve the account and allow
            reactivation, or for another lawful purpose.
          </p>
          <p>
            When you request deletion, Beauty Connect may deactivate your
            account and remove your profile from discovery promptly. Personal
            information that no longer has a legitimate retention purpose is
            generally targeted for deletion within 30 days. This is an
            operational target, not a promise that every copy disappears
            immediately.
          </p>
          <p>
            Information may be retained for longer where reasonably necessary
            for a legal or regulatory obligation, security, fraud or abuse
            prevention, an investigation, dispute resolution, enforcement of
            these Terms, or the establishment, exercise or defence of legal
            claims. Secure backups may also retain information temporarily and
            are not intended to restore deleted information except for a
            legitimate operational, security or legal purpose.
          </p>
        </LegalSection>

        <LegalSection number="11" title="Intellectual property">
          <p>
            The Platform, including its software, interface, branding, logos,
            design elements, text, graphics and materials created by or for
            Beauty Connect, is owned by or licensed to Beauty Connect unless
            stated otherwise. You may use it only for its intended purposes and
            must not copy, distribute, modify, commercially exploit or create
            derivative works from proprietary materials except where permitted
            by law or with our written permission.
          </p>
        </LegalSection>

        <LegalSection number="12" title="Availability and third-party services">
          <p>
            We will make reasonable efforts to maintain the Platform, but we do
            not promise that it will always be available, uninterrupted,
            error-free, secure against every possible threat or compatible with
            every device or software environment. We may modify, suspend or
            discontinue features, with reasonable notice where appropriate.
          </p>
          <p>
            Beauty Connect may use third-party providers for hosting,
            authentication, storage, communications, security, analytics or
            other Platform functions. A third-party service may also have its
            own terms or policies. Personal data is handled as described in the
            Privacy Policy and applicable Kenyan law.
          </p>
        </LegalSection>

        <LegalSection
          number="13"
          title="Disclaimers and limitation of liability"
        >
          <p>
            To the extent permitted by Kenyan law, the Platform is provided on
            an “as available” basis. Vetting, profile review and verification
            activities are risk-reduction measures, not guarantees.
          </p>
          <p>
            To the fullest extent permitted by applicable Kenyan law, Beauty
            Connect will not be liable for indirect, incidental, consequential
            or special loss arising from a User’s interaction with another User
            or from a professional relationship formed outside the Platform.
            Nothing in these Terms excludes or restricts liability that cannot
            lawfully be excluded or restricts mandatory statutory rights or
            remedies available to a User.
          </p>
        </LegalSection>

        <LegalSection number="14" title="Indemnity">
          <p>
            To the extent permitted by applicable law, you are responsible for
            losses, claims, liabilities, costs and reasonable expenses arising
            from your material breach of these Terms, unlawful conduct, misuse
            of the Platform, infringement of another person’s rights or
            submission of content you were not authorised to submit. This does
            not require you to indemnify Beauty Connect for its own unlawful
            conduct or for liability that cannot lawfully be transferred to you.
          </p>
        </LegalSection>

        <LegalSection number="15" title="Governing law, disputes and changes">
          <p>
            These Terms are governed by the laws of the Republic of Kenya.
            Nothing in them prevents a User from exercising mandatory rights or
            remedies available under Kenyan law, including seeking relief from a
            competent Kenyan court or a statutory regulator where the law
            provides that right.
          </p>
          <p>
            If you have a concern, contact Beauty Connect first so we can try to
            resolve it promptly and reasonably. We may update these Terms when
            the Platform, our services, applicable law or security requirements
            change. Where a change is material, we will take reasonable steps to
            notify affected Users. An updated version will state its effective
            date.
          </p>
          <p>
            If any provision is unlawful, invalid or unenforceable, it will be
            interpreted or modified to the minimum extent necessary where
            possible. The remaining provisions continue to apply. These Terms,
            the Privacy Policy and any expressly incorporated feature terms form
            the agreement governing use of Beauty Connect.
          </p>
        </LegalSection>

        <ContactSection kind="terms" />
      </LegalGroup>

      <LegalGroup id="terms-employers" number="02" title="Employer section">
        <LegalSection number="17" title="Employer accounts and authority">
          <p>
            An Employer must provide accurate information about the salon or
            beauty business represented by the account. If an individual
            operates the account for a business, that individual confirms that
            they have authority to do so and is responsible for the accuracy of
            the information submitted.
          </p>
          <p>
            Employer profiles may include a business name, operator name,
            location, telephone number, email address, salon photographs,
            services and other relevant business information. This information
            must be kept reasonably accurate and current.
          </p>
        </LegalSection>

        <LegalSection number="18" title="Responsible use of Worker information">
          <p>
            Workers share professional information so Employers can discover and
            evaluate potential professional opportunities. Employers must use
            Worker information responsibly and only for legitimate purposes
            connected with Platform use or a potential professional
            relationship.
          </p>
          <BulletList
            items={[
              "Do not sell, distribute or harvest Worker information for an unrelated database.",
              "Do not spam, harass or intimidate Workers.",
              "Do not use Worker information for unlawful discrimination or another unlawful purpose.",
              "Do not publish private Worker contact information without a lawful basis or permission.",
              "Do not retain or share information more broadly than reasonably necessary for the legitimate purpose for which it was obtained.",
            ]}
          />
        </LegalSection>

        <LegalSection number="19" title="Employer requests and engagement">
          <p>
            Employers should send requests only where they have a genuine
            professional interest in the Worker. Repeated, automated, deceptive
            or abusive requests may result in account restrictions. Sending a
            request does not create an obligation to hire.
          </p>
          <p>
            Following a handshake, an Employer may receive the relevant Worker
            contact information. The Employer remains responsible for handling
            that information lawfully and respectfully, and for making its own
            decisions about suitability, terms, pay, working conditions and
            compliance with Kenyan law.
          </p>
        </LegalSection>
      </LegalGroup>

      <LegalGroup id="terms-workers" number="03" title="Worker section">
        <LegalSection
          number="20"
          title="Worker profiles and application review"
        >
          <p>
            Workers must provide truthful professional information, including
            relevant experience, skills, services, portfolio material and
            qualifications or certifications where provided. Submitting an
            application does not guarantee approval or publication.
          </p>
          <p>
            Beauty Connect may review an application before making a Worker
            profile visible to Employers. The review may include clarifying or
            verifying information, requesting additional information, or
            considering portfolio material. It supports authenticity, quality
            and professional standards; it is not a guarantee of qualifications,
            character, conduct, performance, availability, suitability or future
            employment.
          </p>
        </LegalSection>

        <LegalSection
          number="21"
          title="Worker portfolio and professional information"
        >
          <p>
            Workers must only upload portfolio images and other material they
            are authorised to submit, and must not represent another person’s
            work as their own. Where an image includes another identifiable
            person, the Worker is responsible for considering whether consent or
            another lawful basis is required.
          </p>
          <p>
            Workers must keep information presented to Employers reasonably
            accurate and current. Beauty Connect may require review before
            material profile changes become fully visible or may temporarily
            restrict a profile while those changes are considered.
          </p>
        </LegalSection>

        <LegalSection
          number="22"
          title="Worker requests and contact after a handshake"
        >
          <p>
            A Worker may receive requests from Employers and may respond using
            the options made available by Beauty Connect. A Worker is not
            required to accept every request. Accepting a request may create a
            handshake and disclose the relevant contact information of both
            parties.
          </p>
          <p>
            After contact information is disclosed, communication may take place
            outside the Platform. Workers should use their own judgement and
            take reasonable steps to assess the Employer, the proposed work and
            any resulting arrangement.
          </p>
        </LegalSection>
      </LegalGroup>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="legal-copy">
      <IntroNote>
        Beauty Connect respects your privacy. This Privacy Policy explains what
        personal data we collect, why we collect it, how we use it, when we
        share it, how long we retain it and the rights available to you under
        applicable Kenyan data protection law. It applies to Workers, Employers
        and visitors who interact with the Platform.
      </IntroNote>

      <LegalGroup id="privacy-general" number="01" title="General privacy">
        <LegalSection
          number="1"
          title="Who we are and the scope of this Policy"
        >
          <p>
            Beauty Connect operates a marketplace connecting beauty
            professionals with salons and beauty businesses. Depending on the
            processing activity, Beauty Connect may act as a data controller
            where it determines the purposes and means of processing personal
            data, and may use data processors to process personal data on its
            behalf.
          </p>
          <ContactDetails privacy />
          <p>
            This Policy applies to personal data collected through the Platform,
            account creation, profiles, requests, handshakes, support and
            related interactions. It should be read with the Terms &amp;
            Conditions.
          </p>
        </LegalSection>

        <LegalSection number="2" title="Kenyan legal framework">
          <p>
            Beauty Connect intends to process personal data in accordance with
            applicable Kenyan law, including:
          </p>
          <BulletList
            items={[
              "the Constitution of Kenya, including the right to privacy;",
              "the Data Protection Act, No. 24 of 2019;",
              "the Data Protection (General) Regulations, 2021;",
              "the Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021;",
              "the Data Protection (Complaints Handling and Enforcement Procedures) Regulations, 2021; and",
              "other applicable laws and regulatory requirements.",
            ]}
          />
          <p>
            We seek to apply lawful, fair and transparent processing, purpose
            limitation, data minimisation, accuracy and retention limitation.
          </p>
        </LegalSection>

        <LegalSection number="3" title="Personal data we collect">
          <p>
            The information we collect depends on how you use Beauty Connect and
            may include:
          </p>
          <DataGrid
            items={[
              [
                "Account data",
                "name, email address, telephone number, login and authentication information, and account role.",
              ],
              [
                "Profile data",
                "profile photograph, county or location, professional information, business information, salon information, services, skills, work experience, portfolio material and salon photographs.",
              ],
              [
                "Platform activity",
                "requests sent or received, request status, profile interactions, connections or handshakes, account status, submitted content and security events.",
              ],
              [
                "Technical data",
                "IP address, browser or device information, operating system, technical identifiers, log information and information about how the Platform is accessed, depending on the Platform configuration.",
              ],
            ]}
          />
          <p>
            We seek to collect information that is adequate, relevant and
            limited to what is reasonably necessary for the relevant purpose.
          </p>
        </LegalSection>

        <LegalSection
          number="4"
          title="Information you choose to provide and visibility"
        >
          <p>
            You decide what information to submit, subject to information
            required to create and operate an account. Information submitted to
            the marketplace may become visible to other Users according to your
            role and the Platform’s functionality. Do not place private
            information in public-facing profile fields unless you are
            comfortable with it being displayed.
          </p>
          <p>
            Beauty Connect does not automatically give one User access to all
            information held about another User. Visibility and contact
            disclosure are described below and in the Terms &amp; Conditions.
          </p>
        </LegalSection>

        <LegalSection number="5" title="Why we process personal data">
          <p>We may process personal data where reasonably necessary to:</p>
          <BulletList
            items={[
              "create, authenticate and manage accounts;",
              "provide the Platform and create or display profiles;",
              "help Workers and Employers discover one another;",
              "facilitate requests, connections and handshakes;",
              "disclose contact information following a handshake;",
              "review Worker applications and submitted information;",
              "communicate with Users and provide support;",
              "maintain Platform security and detect or prevent fraud, abuse and misuse;",
              "investigate complaints and incidents and enforce the Terms;",
              "maintain accurate records and improve Platform functionality;",
              "comply with legal and regulatory obligations; and",
              "establish, exercise or defend legal claims.",
            ]}
          />
          <p>
            We do not intend to collect personal data simply because it might be
            interesting to have. The aim is purpose first, data second.
          </p>
        </LegalSection>

        <LegalSection number="6" title="Lawful bases for processing">
          <p>
            Depending on the circumstances, Beauty Connect may rely on one or
            more lawful bases recognised under Kenyan data protection law,
            including:
          </p>
          <BulletList
            items={[
              "your consent;",
              "steps necessary to provide a service or perform an agreement with you;",
              "compliance with a legal obligation;",
              "protection of vital interests where applicable;",
              "legitimate interests, where permitted and not overridden by your rights and interests; and",
              "another lawful basis recognised by applicable law.",
            ]}
          />
          <p>
            Where processing depends on consent, you may withdraw that consent,
            subject to circumstances where another lawful basis permits
            continued processing.
          </p>
        </LegalSection>

        <LegalSection number="7" title="Worker application review and vetting">
          <p>
            Worker applications may be reviewed before a Worker profile becomes
            visible to Employers. During this process, Beauty Connect may use
            information supplied by the Worker to assess whether the profile
            meets applicable marketplace requirements, and may contact the
            Worker to clarify or confirm information, request more information,
            discuss portfolio material or address authenticity and professional
            presentation concerns.
          </p>
          <p>
            The purpose is to support the integrity and quality of the
            marketplace. Approval does not guarantee a Worker’s qualifications,
            character, conduct, performance, availability, suitability or future
            employment relationship.
          </p>
        </LegalSection>

        <LegalSection number="8" title="Profile visibility and the handshake">
          <HandshakeCallout privacy />
          <p>
            Before a handshake, Employers may see discovery information about a
            Worker such as name, profile photograph, county or location,
            experience, skills, services and portfolio material. Workers may see
            discovery information about an Employer such as the salon or
            business name, location, salon images and services offered.
          </p>
          <p>
            Private phone and email details are not ordinarily disclosed to the
            other party before the relevant handshake. After a handshake, Beauty
            Connect may disclose relevant contact details to both parties so
            they can communicate directly. The disclosure is part of the service
            the User chose to participate in.
          </p>
          <p>
            Once information has been disclosed to another User, Beauty Connect
            cannot control how that recipient stores, copies or communicates it.
            Recipients remain subject to the Terms and applicable law.
          </p>
        </LegalSection>

        <LegalSection number="9" title="How we share personal data">
          <p>
            We may share personal data where reasonably necessary for the
            purposes described in this Policy, including with:
          </p>
          <DataGrid
            items={[
              [
                "Other Users",
                "information shown according to the Platform’s marketplace visibility and handshake rules.",
              ],
              [
                "Service providers",
                "providers supporting hosting, authentication, cloud infrastructure, database services, storage, communications, security, monitoring, analytics and other operations. They may process information on our behalf.",
              ],
              [
                "Authorities",
                "public bodies, courts, regulators or law-enforcement authorities where disclosure is required or authorised by law, court order, lawful request or regulatory process.",
              ],
              [
                "Security and legal matters",
                "information where reasonably necessary to investigate fraud, prevent abuse, protect Users or the Platform, investigate security incidents, enforce the Terms or establish, exercise or defend legal claims.",
              ],
            ]}
          />
          <p>We do not sell personal data merely as a source of revenue.</p>
        </LegalSection>

        <LegalSection
          number="10"
          title="International or cross-border transfers"
        >
          <p>
            Some providers used to operate modern online platforms may process
            information outside Kenya. Where personal data is transferred
            outside Kenya, Beauty Connect will seek to comply with applicable
            Kenyan requirements governing cross-border transfers, including
            appropriate safeguards or consent where relevant.
          </p>
        </LegalSection>

        <LegalSection number="11" title="Data security">
          <p>
            Beauty Connect takes reasonable technical and organisational
            measures designed to protect personal data against unauthorised
            access, loss, misuse, alteration, disclosure and destruction. No
            online system can honestly promise perfect security, so we cannot
            guarantee that every security threat can be prevented.
          </p>
          <p>
            Where a personal-data breach triggers obligations under applicable
            Kenyan law, we will follow the applicable breach-response and
            notification requirements.
          </p>
        </LegalSection>

        <LegalSection number="12" title="Retention, deactivation and deletion">
          <p>
            We retain personal data for as long as reasonably necessary for the
            purpose for which it was collected or another lawful purpose. A
            deactivated account may retain information needed to preserve the
            account and allow reactivation.
          </p>
          <p>
            When you request deletion, the account may be deactivated and the
            marketplace profile removed from discovery promptly. Personal
            information that no longer has a legitimate retention purpose is
            generally targeted for deletion within 30 days. This is a general
            operational target, not a promise that every record disappears
            immediately.
          </p>
          <p>
            Longer retention may apply where reasonably necessary for legal or
            regulatory obligations, security, fraud or abuse prevention,
            investigations, disputes, enforcement of the Terms, or the
            establishment, exercise or defence of legal claims. Secure backup
            copies may exist temporarily and are not intended to restore deleted
            information except for a legitimate operational, security or legal
            purpose.
          </p>
        </LegalSection>

        <LegalSection
          number="13"
          title="Your rights under Kenyan data protection law"
        >
          <p>
            Subject to applicable legal conditions and limitations, you may have
            the right:
          </p>
          <BulletList
            items={[
              "to be informed about the use to which your personal data is put;",
              "to access personal data held about you;",
              "to object to processing of all or part of your personal data;",
              "to request correction of false or misleading personal data;",
              "to request deletion of false or misleading personal data; and",
              "where applicable under the Act, regulations or another legal basis, to request restriction, erasure or portability of personal data.",
            ]}
          />
          <p>
            These rights are not absolute. A request may be limited where
            applicable law permits or requires continued processing, including
            for legal obligations, security, the rights of others or the
            establishment, exercise or defence of legal claims.
          </p>
        </LegalSection>

        <LegalSection number="14" title="How to exercise your data rights">
          <p>
            To make a privacy or data-rights request, contact the Beauty Connect
            privacy contact identified below. Please provide enough information
            for us to understand the request and reasonably verify that it
            relates to you. We will handle requests in accordance with
            applicable Kenyan law and explain any refusal or limitation where
            the law permits us to do so.
          </p>
          <ContactDetails privacy />
        </LegalSection>

        <LegalSection number="15" title="Complaints">
          <p>
            If you believe Beauty Connect has handled your personal data
            improperly, please contact us first so we can investigate and try to
            resolve the concern. You may also have the right to lodge a
            complaint with the Office of the Data Protection Commissioner
            (ODPC), the statutory regulator responsible for regulating
            personal-data processing and protecting data-subject rights in
            Kenya, in accordance with applicable law.
          </p>
          <p>
            We do not include regulator contact details in this Policy because
            official channels may change. Use the current official ODPC channels
            when making a regulatory complaint.
          </p>
        </LegalSection>

        <LegalSection number="16" title="Cookies and similar technologies">
          <p>
            Beauty Connect may use cookies, local storage or similar
            technologies where reasonably necessary to maintain authentication,
            keep you signed in, maintain security, remember necessary settings,
            understand technical performance or provide optional analytics and
            other functionality. Where a technology requires consent under
            applicable law, we will provide an appropriate mechanism for
            obtaining and managing that consent.
          </p>
        </LegalSection>

        <LegalSection number="17" title="Adults and children’s data">
          <p>
            Beauty Connect is intended for adults aged 18 and above. We do not
            intentionally design the Platform to collect personal data from
            children. If we become aware that an account was created by a person
            who does not meet the minimum age requirement, we may restrict or
            remove the account and handle associated information in accordance
            with applicable law.
          </p>
        </LegalSection>

        <LegalSection number="18" title="Changes to this Policy">
          <p>
            We may update this Privacy Policy where reasonably necessary because
            of changes to the Platform, our processing activities, applicable
            law, service providers, security or operations, or regulatory
            guidance. Where changes are material, we will take reasonable steps
            to notify affected Users. The updated Policy will state its
            effective date.
          </p>
        </LegalSection>
      </LegalGroup>

      <LegalGroup id="privacy-employers" number="02" title="Employer privacy">
        <LegalSection number="19" title="Employer data and use">
          <p>
            An Employer may provide a salon or business name, operator name,
            telephone number, email address, location, salon photographs,
            services offered, account activity and requests sent to Workers.
          </p>
          <p>
            We may use this information to create and operate the Employer
            account, display appropriate business information, allow Workers to
            discover relevant Employers, facilitate requests and handshakes,
            disclose relevant contact information after a handshake, maintain
            security, investigate misuse and comply with applicable law.
          </p>
        </LegalSection>

        <LegalSection
          number="20"
          title="Employer visibility and contact disclosure"
        >
          <p>
            Before a handshake, private Employer contact details are not
            ordinarily disclosed to Workers. After a handshake, relevant contact
            details may be disclosed to the Worker so the parties can
            communicate directly. Employers remain responsible for ensuring
            their profile, images and business information are accurate and
            lawful.
          </p>
        </LegalSection>
      </LegalGroup>

      <LegalGroup id="privacy-workers" number="03" title="Worker privacy">
        <LegalSection number="21" title="Worker data and use">
          <p>
            A Worker may provide a name, profile photograph, telephone number,
            email address, county or location, professional experience, skills,
            services, portfolio material, qualifications or certifications where
            provided, application information, information supplied during
            review and Platform activity associated with requests and
            connections.
          </p>
          <p>
            We may use this information to create the Worker profile, review the
            application, conduct appropriate marketplace review, display the
            profile to Employers, facilitate requests and handshakes, disclose
            relevant contact information following a handshake, maintain
            security, investigate complaints or misuse and comply with
            applicable law.
          </p>
        </LegalSection>

        <LegalSection number="22" title="Worker review, portfolios and images">
          <p>
            Before a Worker profile becomes visible to Employers, Beauty Connect
            may review information provided by the Worker and ask questions or
            request additional information. The review supports authenticity,
            quality and professional standards; it does not guarantee
            qualifications, conduct, performance, availability or employment.
          </p>
          <p>
            Workers should only upload portfolio material they are authorised to
            use and should consider consent or another lawful basis where an
            identifiable person appears in an image. Beauty Connect may remove
            an image where a rights, privacy, safety, misleading-content or
            Terms concern is raised or removal is otherwise reasonably
            necessary.
          </p>
        </LegalSection>

        <LegalSection
          number="23"
          title="Worker accuracy and contact disclosure"
        >
          <p>
            Before a handshake, a Worker’s private phone number and email
            address are not ordinarily disclosed to Employers. After a
            handshake, relevant contact details may be disclosed to the
            Employer. Workers are responsible for keeping professional
            information reasonably accurate and current and may request
            correction of inaccurate personal data.
          </p>
          <p>
            Beauty Connect seeks to collect information that is adequate,
            relevant and limited to what is necessary for the relevant purpose.
            We do not intend to collect highly sensitive information merely
            because it is technically possible to do so.
          </p>
        </LegalSection>

        <LegalSection number="24" title="Contact and regulatory reference">
          <p>
            For general questions, contact Beauty Connect using the general
            contact details below. For personal-data matters, use the privacy
            contact. This Policy is intended to operate consistently with the
            applicable Kenyan data-protection framework, including the Data
            Protection Act, 2019 and applicable regulations administered by the
            ODPC.
          </p>
          <ContactDetails privacy />
        </LegalSection>
      </LegalGroup>
    </div>
  );
}

function LegalGroup({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="legal-group scroll-mt-8">
      <div className="legal-group-heading flex items-baseline gap-3 border-b border-[#e4ebe5] pb-4">
        <span className="font-mono text-xs font-semibold tracking-[0.12em] text-[#9aa9a0]">
          {number}
        </span>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#123f31] sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="mt-7 grid gap-8">{children}</div>
    </section>
  );
}

function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-section">
      <h3 className="flex items-baseline gap-2 text-base font-semibold tracking-[-0.015em] text-[#203f31] sm:text-[17px]">
        <span className="font-mono text-xs font-medium text-[#8a9c91]">
          {number}.
        </span>
        <span>{title}</span>
      </h3>
      <div className="legal-section-copy mt-3 grid gap-3 text-[14px] leading-7 text-[#53645b] sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

function IntroNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-intro mb-10 rounded-2xl border border-[#dce9de] bg-[#f6faf6] p-5 text-[15px] leading-7 text-[#365646] sm:p-6">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#5e7d6a]" />
        <div>{children}</div>
      </div>
    </div>
  );
}

function HandshakeCallout({ privacy = false }: { privacy?: boolean }) {
  return (
    <aside className="legal-callout rounded-2xl border border-[#e1d9f1] bg-[#f7f3fc] p-5 text-[14px] leading-7 text-[#5d5470]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6c5a97]">
        The handshake boundary
      </p>
      <p className="mt-2">
        {privacy
          ? "Before a handshake, discovery information may be visible but private phone and email details are not ordinarily disclosed. After a handshake, relevant contact details may be disclosed to both parties for direct communication."
          : "Before a handshake, Users see discovery information intended for their role, not private phone or email details. After a handshake, relevant contact details may be disclosed to both parties."}
      </p>
    </aside>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="legal-bullets grid gap-2 pl-5">
      {items.map((item) => (
        <li key={item} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

function DefinitionList({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-3 rounded-xl border border-[#e5ebe5] bg-[#fbfcfa] p-4">
      {items.map(([term, definition]) => (
        <div
          key={term}
          className="grid gap-1 sm:grid-cols-[115px_minmax(0,1fr)] sm:gap-3"
        >
          <dt className="font-semibold text-[#284638]">{term}</dt>
          <dd>{definition}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {items.map(([term, definition]) => (
        <div
          key={term}
          className="rounded-xl border border-[#e5ebe5] bg-[#fbfcfa] p-4"
        >
          <dt className="font-semibold text-[#284638]">{term}</dt>
          <dd className="mt-1.5 text-[13px] leading-6">{definition}</dd>
        </div>
      ))}
    </dl>
  );
}

function ContactDetails({ privacy = false }: { privacy?: boolean }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[#e5ebe5] bg-[#fbfcfa] p-4 text-[13px] leading-6 sm:grid-cols-2">
      <div>
        <p className="font-semibold text-[#284638]">Legal entity / operator</p>
        <p>Beauty Connect</p>
      </div>
      <div>
        <p className="font-semibold text-[#284638]">
          {privacy ? "Privacy contact" : "General / legal contact"}
        </p>
        <p>beautyconnect254@gmail.com</p>
      </div>
      <div>
        <p className="font-semibold text-[#284638]">Telephone</p>
        <p>+254721140200</p>
      </div>
      <div>
        <p className="font-semibold text-[#284638]">Operating country</p>
        <p>Kenya</p>
      </div>
    </div>
  );
}

function ContactSection({ kind }: { kind: LegalKind }) {
  return (
    <LegalSection number={kind === "terms" ? "16" : "24"} title="Contact">
      <p>
        For questions about these {kind === "terms" ? "Terms" : "documents"},
        contact Beauty Connect using the details below.
      </p>
      <ContactDetails privacy={kind === "privacy"} />
    </LegalSection>
  );
}
