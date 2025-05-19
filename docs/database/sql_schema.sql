-- Property Management System SQL Schema
-- This SQL schema is for reference purposes
-- The actual implementation uses Firebase Firestore

-- Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    phone_number VARCHAR(50),
    role ENUM('admin', 'agent', 'viewer') NOT NULL DEFAULT 'agent',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    floor VARCHAR(50),
    deposit DECIMAL(12, 2) NOT NULL,
    monthly_rent DECIMAL(12, 2) NOT NULL,
    maintenance_fee DECIMAL(12, 2),
    area DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    status ENUM('available', 'underContract', 'rented') NOT NULL DEFAULT 'available',
    owner_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Property Images Table
CREATE TABLE property_images (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Tags Table
CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Property Tags Junction Table
CREATE TABLE property_tags (
    property_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id, tag_id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Clients Table
CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    agent_id VARCHAR(36) NOT NULL,
    preferences JSON,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Showcases Table
CREATE TABLE showcases (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url_id VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    creator_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36),
    branding JSON,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    view_count INT NOT NULL DEFAULT 0,
    invitation_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_viewed TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Showcase Properties Junction Table
CREATE TABLE showcase_properties (
    showcase_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (showcase_id, property_id),
    FOREIGN KEY (showcase_id) REFERENCES showcases(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Client Interactions Table
CREATE TABLE client_interactions (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    type ENUM('showcase_view', 'property_view', 'message', 'appointment') NOT NULL,
    reference_id VARCHAR(36),
    user_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSON,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments Table
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY,
    client_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36),
    type ENUM('message', 'showcase', 'appointment', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id VARCHAR(36),
    reference_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Showcase Invitations Table
CREATE TABLE showcase_invitations (
    id VARCHAR(36) PRIMARY KEY,
    showcase_id VARCHAR(36) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    sent_by VARCHAR(36) NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    FOREIGN KEY (showcase_id) REFERENCES showcases(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Showcase Views Table
CREATE TABLE showcase_views (
    id VARCHAR(36) PRIMARY KEY,
    showcase_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    referrer TEXT,
    device VARCHAR(50),
    location JSON,
    user_id VARCHAR(36),
    FOREIGN KEY (showcase_id) REFERENCES showcases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for optimized queries

-- Properties indexes
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_status_created ON properties(status, created_at);
CREATE INDEX idx_properties_search ON properties(deposit, monthly_rent, area);
CREATE INDEX idx_properties_location ON properties(location_latitude, location_longitude);

-- Property Images indexes
CREATE INDEX idx_property_images_property ON property_images(property_id);
CREATE INDEX idx_property_images_order ON property_images(property_id, display_order);

-- Property Tags indexes
CREATE INDEX idx_property_tags_tag ON property_tags(tag_id);

-- Clients indexes
CREATE INDEX idx_clients_agent ON clients(agent_id);
CREATE INDEX idx_clients_email ON clients(email);

-- Showcases indexes
CREATE INDEX idx_showcases_creator ON showcases(creator_id);
CREATE INDEX idx_showcases_client ON showcases(client_id);
CREATE INDEX idx_showcases_url ON showcases(url_id);
CREATE INDEX idx_showcases_active ON showcases(active);

-- Showcase Properties indexes
CREATE INDEX idx_showcase_properties_property ON showcase_properties(property_id);
CREATE INDEX idx_showcase_properties_order ON showcase_properties(showcase_id, display_order);

-- Client Interactions indexes
CREATE INDEX idx_client_interactions_client ON client_interactions(client_id);
CREATE INDEX idx_client_interactions_type ON client_interactions(type);
CREATE INDEX idx_client_interactions_reference ON client_interactions(reference_id);
CREATE INDEX idx_client_interactions_time ON client_interactions(timestamp);

-- Appointments indexes
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_property ON appointments(property_id);
CREATE INDEX idx_appointments_agent ON appointments(agent_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_agent_scheduled ON appointments(agent_id, scheduled_at);

-- Messages indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_read ON messages(recipient_id, read);
CREATE INDEX idx_messages_time ON messages(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_time ON notifications(created_at);

-- Showcase Invitations indexes
CREATE INDEX idx_showcase_invitations_showcase ON showcase_invitations(showcase_id);
CREATE INDEX idx_showcase_invitations_email ON showcase_invitations(client_email);

-- Showcase Views indexes
CREATE INDEX idx_showcase_views_showcase ON showcase_views(showcase_id);
CREATE INDEX idx_showcase_views_time ON showcase_views(timestamp);
CREATE INDEX idx_showcase_views_user ON showcase_views(user_id);

-- Stored procedures for common operations

DELIMITER //

-- Create procedure to get client's activity history
CREATE PROCEDURE GetClientActivityHistory(IN p_client_id VARCHAR(36))
BEGIN
    SELECT * FROM client_interactions
    WHERE client_id = p_client_id
    ORDER BY timestamp DESC;
END //

-- Create procedure to get agent's appointments for a day
CREATE PROCEDURE GetAgentDailyAppointments(
    IN p_agent_id VARCHAR(36),
    IN p_date DATE
)
BEGIN
    SELECT a.*, 
           c.name AS client_name, 
           c.phone AS client_phone,
           p.title AS property_title, 
           p.address AS property_address
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN properties p ON a.property_id = p.id
    WHERE a.agent_id = p_agent_id
    AND DATE(a.scheduled_at) = p_date
    ORDER BY a.scheduled_at ASC;
END //

-- Create procedure to update property status
CREATE PROCEDURE UpdatePropertyStatus(
    IN p_property_id VARCHAR(36),
    IN p_status ENUM('available', 'underContract', 'rented')
)
BEGIN
    UPDATE properties
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_property_id;
END //

-- Create procedure to get property suggestions for client
CREATE PROCEDURE GetPropertySuggestionsForClient(
    IN p_client_id VARCHAR(36),
    IN p_limit INT
)
BEGIN
    DECLARE v_agent_id VARCHAR(36);
    
    -- Get client's agent
    SELECT agent_id INTO v_agent_id
    FROM clients
    WHERE id = p_client_id;
    
    -- Get properties matching client preferences
    -- This is a simplified version, in reality this would include more complex matching logic
    SELECT p.*
    FROM properties p
    JOIN clients c ON c.id = p_client_id
    WHERE p.status = 'available'
    AND p.owner_id = v_agent_id
    -- Add more matching criteria based on client preferences
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END //

-- Create procedure to get showcase statistics
CREATE PROCEDURE GetShowcaseStatistics(IN p_showcase_id VARCHAR(36))
BEGIN
    SELECT 
        s.id, 
        s.title,
        s.view_count,
        s.invitation_count,
        COUNT(DISTINCT sv.id) AS total_views,
        COUNT(DISTINCT sv.user_id) AS unique_viewers,
        MAX(sv.timestamp) AS last_viewed
    FROM showcases s
    LEFT JOIN showcase_views sv ON s.id = sv.showcase_id
    WHERE s.id = p_showcase_id
    GROUP BY s.id, s.title, s.view_count, s.invitation_count;
END //

DELIMITER ;

-- Triggers for data integrity and automatic updates

DELIMITER //

-- Trigger to update showcase view count
CREATE TRIGGER after_showcase_view_insert
AFTER INSERT ON showcase_views
FOR EACH ROW
BEGIN
    UPDATE showcases
    SET view_count = view_count + 1,
        last_viewed = NEW.timestamp
    WHERE id = NEW.showcase_id;
END //

-- Trigger to set updated_at timestamp
CREATE TRIGGER before_property_update
BEFORE UPDATE ON properties
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //

-- Trigger to create notification when message is sent
CREATE TRIGGER after_message_insert
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        body,
        reference_id,
        reference_type,
        created_at
    ) VALUES (
        NEW.recipient_id,
        NEW.sender_id,
        'message',
        '새로운 메시지가 도착했습니다',
        SUBSTRING(NEW.content, 1, 100),
        NEW.id,
        'message',
        NEW.created_at
    );
END //

-- Trigger to update message read_at timestamp
CREATE TRIGGER before_message_update
BEFORE UPDATE ON messages
FOR EACH ROW
BEGIN
    IF OLD.read = FALSE AND NEW.read = TRUE THEN
        SET NEW.read_at = NOW();
    END IF;
END //

-- Trigger to create notification when appointment is created
CREATE TRIGGER after_appointment_insert
AFTER INSERT ON appointments
FOR EACH ROW
BEGIN
    -- Notification for agent
    INSERT INTO notifications (
        recipient_id,
        type,
        title,
        body,
        reference_id,
        reference_type,
        created_at
    ) VALUES (
        NEW.agent_id,
        'appointment',
        '새로운 방문 예약이 등록되었습니다',
        CONCAT('예약 시간: ', DATE_FORMAT(NEW.scheduled_at, '%Y-%m-%d %H:%i')),
        NEW.id,
        'appointment',
        NOW()
    );
END //

DELIMITER ;
