CREATE TABLE users (
    userid SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar_public_id TEXT,
    avatar_url TEXT,
    role VARCHAR DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_password_token TEXT,
    reset_password_expire TIMESTAMP
);


CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR NOT NULL,
    ownerid INT REFERENCES users(userid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration INTERVAL,
    total_videos INTEGER,
    course_price INTEGER
);

CREATE TABLE course_videos (
    video_id SERIAL PRIMARY KEY,
    video_title VARCHAR NOT NULL,
    course_id INT NOT NULL REFERENCES courses(course_id),
    video_number INT,
    view_count INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    video_url TEXT -- Added video_url field
);


CREATE TABLE course_enrolled (
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (course_id, user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (user_id) REFERENCES users(userid)
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(userid),
    course_id INT NOT NULL REFERENCES courses(course_id),
    video_id INT NOT NULL REFERENCES course_videos(video_id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id, user_id) REFERENCES course_enrolled(course_id, user_id)
);