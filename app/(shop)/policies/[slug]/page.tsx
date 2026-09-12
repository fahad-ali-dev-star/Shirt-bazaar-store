import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Policy = {
  title: string;
  intro: string;
  sections: PolicySection[];
};

const policies: Record<string, Policy> = {
  about: {
    title: "About Us",
    intro: "Shirt Bazaar was built for people who want their basics to actually last.",
    sections: [
      {
        heading: "What we value",
        paragraphs: [
          "We work with combed ring-spun cotton and focus on fit and finish rather than chasing every trend, so a shirt you buy today still looks and feels right a year from now.",
          "Every piece is checked before it ships, and every order is backed by an easy return process because we'd rather earn your trust than just your first sale.",
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    intro: "We deliver orders across Pakistan with Cash on Delivery available nationwide.",
    sections: [
      {
        heading: "Delivery details",
        bullets: [
          "Delivery time: 3–5 business days nationwide.",
          "Shipping cost: Rs 150 in major cities, Rs 250 elsewhere, and free on orders of Rs 3,000 or more.",
          "Order tracking: You'll receive tracking information once your order ships.",
          "Cash on Delivery: Available nationwide. Please keep exact change ready for the delivery rider where possible.",
          "Delays: Orders placed on weekends or public holidays are processed the next business day.",
        ],
      },
    ],
  },
  returns: {
    title: "Return & Exchange Policy",
    intro: "We want you to be happy with your order. Please review these conditions before sending an item back.",
    sections: [
      {
        heading: "Returns and exchanges",
        bullets: [
          "Returns are accepted within 7 days of delivery, provided the item is unworn, unwashed, and in original packaging with tags attached.",
          "To start a return, contact us with your order number and reason for the return.",
          "Exchanges for size or color are free of charge. Refunds for COD orders are processed via bank transfer after we receive the returned item.",
          "Sale and clearance items are final sale unless defective.",
          "Items damaged in transit or with manufacturing defects are eligible for a free replacement. Please send photos when you contact us.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "Shirt Bazaar collects only the information needed to process and deliver your order.",
    sections: [
      {
        heading: "Information we use",
        paragraphs: [
          "This includes your name, phone number, delivery address, and order details. We do not sell or share your personal information with third parties, except delivery partners solely for fulfilling your order.",
          "Payment information for COD orders is handled at the point of delivery and is never stored on our servers. If you have questions about your data, please contact us through the details provided with your order.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "These terms help us keep ordering and delivery straightforward for everyone.",
    sections: [
      {
        heading: "Using Shirt Bazaar",
        bullets: [
          "By placing an order with Shirt Bazaar, you agree to provide accurate delivery information and to be available to receive Cash on Delivery orders at the address provided.",
          "We reserve the right to cancel orders that appear fraudulent or where delivery attempts repeatedly fail.",
          "Product prices and availability are subject to change without notice.",
          "Product images are for illustrative purposes; slight variations in color or texture may occur due to fabric batch differences.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  return { title: policy?.title ?? "Policies" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies[slug];

  if (!policy) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <Link href="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← Back to Shirt Bazaar
      </Link>
      <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Shirt Bazaar</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">{policy.title}</h1>
        <p className="mt-5 text-base leading-7 text-slate-600">{policy.intro}</p>
        <div className="mt-10 space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-slate-900">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-slate-600">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}