import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PublicSite } from "@/components/public/PublicSite";
import type { SiteData, ProfileData, SkillCategory } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbashenko.com";

const getProfileForMeta = cache(async () => {
  try {
    return await prisma.profile.findFirst();
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfileForMeta();
  const name = profile?.name ?? "Aleksandr Albekov";
  const description = profile?.bioEn ?? "Linux systems, containers, pipelines. Building infrastructure that doesn't wake me at 3am.";
  const pageTitle = `${name} — Personal Site About Networks`;
  const ogParams = new URLSearchParams({
    title: name,
    subtitle: profile?.titleEn ?? "DevOps Engineer",
    description,
  });
  const ogImage = `${siteUrl}/api/og?${ogParams.toString()}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: siteUrl,
      type: "profile",
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImage],
    },
    alternates: { canonical: siteUrl },
  };
}

type DbPost = Awaited<ReturnType<typeof prisma.post.findMany>>[number];
type DbProject = Awaited<ReturnType<typeof prisma.project.findMany>>[number];
type DbImage = Awaited<ReturnType<typeof prisma.galleryImage.findMany>>[number];
type DbCVEntry = Awaited<ReturnType<typeof prisma.cVEntry.findMany>>[number];

async function getSiteData(): Promise<SiteData> {
  try {
    const [profile, posts, projects, gallery, cvEntries] = await Promise.all([
      prisma.profile.findFirst(),
      prisma.post.findMany({ where: { published: true }, orderBy: { date: "desc" } }),
      prisma.project.findMany({ orderBy: { order: "asc" } }),
      prisma.galleryImage.findMany({ orderBy: { order: "asc" } }),
      prisma.cVEntry.findMany({ orderBy: { order: "asc" } }),
    ]);

    const defaultProfile: ProfileData = {
      id: 1,
      name: "Aleksandr Albekov",
      birthday: "2004-07-13",
      location: "Slovakia",
      titleEn: "DevOps Engineer",
      titleRu: "DevOps инженер",
      titleSk: "DevOps inžinier",
      bioEn: "Linux systems, containers, pipelines. Building infrastructure that doesn't wake me at 3am.",
      bioRu: "Linux системы, контейнеры, пайплайны. Строю инфраструктуру, которая не разбудит меня в 3 ночи.",
      bioSk: "Linux systémy, kontajnery, pipeline. Budujem infraštruktúru, ktorá ma nezobudí o 3 ráno.",
      photo: null,
      email: "",
      github: "",
      telegram: "",
      linkedin: "",
      skills: [
        { cat: "Systems & DevOps", items: ["Linux (Ubuntu, Debian, RHEL)", "Docker", "Kubernetes (K8s)", "Jenkins", "GitLab CI", "Git / GitHub"] },
        { cat: "Programming", items: ["Python", "TypeScript / JavaScript", "Bash"] },
        { cat: "Infrastructure & Cloud", items: ["Network Configuration", "VPN (NetBird)", "Vercel", "Coolify"] },
        { cat: "Databases", items: ["SQL", "NoSQL"] },
      ],
    };

    const profileData: ProfileData = profile
      ? {
          id: profile.id,
          name: profile.name,
          birthday: profile.birthday,
          location: profile.location,
          titleEn: profile.titleEn,
          titleRu: profile.titleRu,
          titleSk: profile.titleSk,
          bioEn: profile.bioEn,
          bioRu: profile.bioRu,
          bioSk: profile.bioSk,
          photo: profile.photo,
          email: profile.email,
          github: profile.github,
          telegram: profile.telegram,
          linkedin: profile.linkedin,
          skills: (profile.skills as unknown as SkillCategory[]) || defaultProfile.skills,
        }
      : defaultProfile;

    return {
      profile: profileData,
      posts: posts.map((p: DbPost) => ({
        id: p.id,
        title: p.title,
        titleRu: p.titleRu,
        titleSk: p.titleSk,
        content: p.content,
        contentRu: p.contentRu,
        contentSk: p.contentSk,
        date: p.date,
        tags: p.tags,
        published: p.published,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      projects: projects.map((p: DbProject) => ({
        id: p.id,
        name: p.name,
        desc: p.desc,
        stack: p.stack,
        github: p.github,
        url: p.url,
        order: p.order,
      })),
      gallery: gallery.map((g: DbImage) => ({
        id: g.id,
        src: g.src,
        caption: g.caption,
        order: g.order,
      })),
      cvEntries: cvEntries.map((e: DbCVEntry) => ({
        id: e.id,
        type: e.type as "experience" | "education" | "certification",
        role: e.role,
        company: e.company,
        degree: e.degree,
        institution: e.institution,
        name: e.name,
        issuer: e.issuer,
        start: e.start,
        end: e.end,
        desc: e.desc,
        date: e.date,
        order: e.order,
      })),
    };
  } catch {
    // If DB is not available (e.g. first run), return defaults
    return {
      profile: {
        id: 1,
        name: "Aleksandr Albekov",
        birthday: "2004-07-13",
        location: "Slovakia",
        titleEn: "DevOps Engineer",
        titleRu: "DevOps инженер",
        titleSk: "DevOps inžinier",
        bioEn: "Linux systems, containers, pipelines.",
        bioRu: "Linux системы, контейнеры, пайплайны.",
        bioSk: "Linux systémy, kontajnery, pipeline.",
        photo: null,
        email: "",
        github: "",
        telegram: "",
        linkedin: "",
        skills: [],
      },
      posts: [],
      projects: [],
      gallery: [],
      cvEntries: [],
    };
  }
}

export const revalidate = 60;

function buildJsonLd(profile: ProfileData) {
  const social = [profile.github, profile.linkedin, profile.telegram]
    .filter(Boolean)
    .map((s) => (s!.startsWith("http") ? s! : `https://${s}`));

  const skills = (profile.skills as SkillCategory[]).flatMap((c) => c.items);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: siteUrl,
    jobTitle: profile.titleEn,
    description: profile.bioEn,
    ...(profile.photo && { image: profile.photo }),
    ...(profile.email && { email: profile.email }),
    ...(social.length > 0 && { sameAs: social }),
    ...(profile.location && { address: { "@type": "Place", name: profile.location } }),
    ...(skills.length > 0 && { knowsAbout: skills }),
  };
}

export default async function HomePage() {
  const data = await getSiteData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(data.profile)) }}
      />
      <PublicSite data={data} />
    </>
  );
}
