import React from 'react'
import { Link } from 'react-router-dom'

const CHIP = "inline-flex items-center rounded-sm border border-current bg-transparent px-3 py-1 text-[10px] font-medium tracking-wider uppercase"
const PRIMARY = "inline-flex items-center gap-2.5 rounded-sm bg-[#fafafa] px-6 py-2.5 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white active:scale-[0.98]"

/*
  EDIT THIS LIST with the real people on the project.
  - name:   full name
  - role:   what they did on this project
  - bio:    one or two sentences
  - photo:  optional. Put the image in frontend/public/ and use "/yourphoto.jpg".
            Leave "" to show initials instead.
  - links:  any of github / linkedin / email (leave out what you do not want)
*/
const TEAM = [
    {
        name: "Krishnapriya",
        role: "Full-stack developer",
        bio: "Built the React frontend, the Node API and the deployment on AWS.",
        photo: "",
        links: {
            github: "https://github.com/krishnapriya1608",
            linkedin: "https://www.linkedin.com/in/krishnapriya-developer/",
            email: "rishnak10@gmail.com.com",
        },
    },
   
]

const initials = (name) =>
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("")

function Avatar({ person }) {
    if (person.photo) {
        return (
            <img
                src={person.photo}
                alt={person.name}
                className="h-20 w-20 rounded-sm border border-white/10 object-cover"
            />
        )
    }
    return (
        <div className="flex h-20 w-20 items-center justify-center rounded-sm border border-white/10 bg-white/[0.03] text-lg font-bold text-neutral-300">
            {initials(person.name)}
        </div>
    )
}

function Team() {
    return (
        <div className="min-h-screen bg-black text-[#fafafa] font-mono selection:bg-[#333] selection:text-white">
            <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
                <Link to="/" className="text-xs font-bold tracking-widest text-neutral-400 hover:text-white uppercase">
                    Codebase
                </Link>
                <nav className="flex items-center gap-3">
                    <Link to="/features" className={`${CHIP} text-neutral-400 hover:text-white`}>Features</Link>
                    <Link to="/login" className={`${CHIP} text-neutral-400 hover:text-white`}>Login</Link>

                    <Link to="/" className={`${CHIP} text-neutral-400 hover:text-white`}>Home</Link>
                    <Link to="/team" className={`${CHIP} text-neutral-400 hover:text-white`}>Team</Link>
                </nav>
            </header>

            <main className="mx-auto max-w-5xl px-6">
                <section className="py-16 md:py-24">
                    <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                        The people who built it.
                    </h1>
                    <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-neutral-400">
                        Codebase is a small project, designed, built and deployed by the people below.
                    </p>
                </section>

                <section className="border-t border-white/10">
                    {TEAM.map((person) => (
                        <article
                            key={person.name}
                            className="grid grid-cols-1 gap-6 border-b border-white/5 py-10 sm:grid-cols-12"
                        >
                            <div className="sm:col-span-3">
                                <Avatar person={person} />
                            </div>
                            <div className="sm:col-span-5">
                                <h2 className="text-lg font-bold tracking-tight">{person.name}</h2>
                                <p className="mt-1 text-xs text-amber-300">{person.role}</p>
                                <p className="mt-4 max-w-sm font-sans text-xs leading-relaxed text-neutral-400">
                                    {person.bio}
                                </p>
                            </div>
                            <ul className="flex flex-wrap content-start gap-2 sm:col-span-4 sm:justify-end">
                                {person.links?.github && (
                                    <li>
                                        <a href={person.links.github} target="_blank" rel="noreferrer"
                                            className={`${CHIP} text-neutral-400 hover:text-white`}>GitHub</a>
                                    </li>
                                )}
                                {person.links?.linkedin && (
                                    <li>
                                        <a href={person.links.linkedin} target="_blank" rel="noreferrer"
                                            className={`${CHIP} text-neutral-400 hover:text-white`}>LinkedIn</a>
                                    </li>
                                )}
                                {person.links?.email && (
                                    <li>
                                        <a href={`mailto:${person.links.email}`}
                                            className={`${CHIP} text-neutral-400 hover:text-white`}>Email</a>
                                    </li>
                                )}
                            </ul>
                        </article>
                    ))}
                </section>

                <section className="py-16">
                    <h2 className="text-xl font-bold tracking-tight">See what we built.</h2>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/register" className={PRIMARY}>Create an account</Link>
                    </div>
                </section>
            </main>

            <footer className="mx-auto max-w-5xl border-t border-white/5 px-6 py-6 text-[10px] text-neutral-600">
                Codebase, a personal project.
            </footer>
        </div>
    )
}

export default Team
