import { prisma } from "@/lib/db";
import { PublicSite } from "@/components/public/PublicSite";
import type { SiteData, ProfileData, SkillCategory } from "@/types";

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

export default async function HomePage() {
  const data = await getSiteData();
  return <PublicSite data={data} />;
}
