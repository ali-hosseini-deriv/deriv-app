import PropTypes      from 'prop-types';
import React          from 'react';
import { BinaryLink } from 'App/Components/Routes';
import Icon           from 'Assets/icon.jsx';
import 'Sass/app/_common/components/platform-list.scss';

const PlatformList = ({
    platform_config,
    handleClick,
}) => (
    <div className='platform_switcher__container' onClick={handleClick}>
        <div className='platform_switcher__list'>
            {platform_config.map((platform, idx) => (
                <BinaryLink to={platform.link_to} href={platform.href} key={idx} onClick={handleClick} className='platform_switcher__list__platform'>
                    <Icon className='platform_switcher__list__platform__icon' icon={platform.icon} />
                    <div className='platform_switcher__list__platform__details'>
                        <p className='platform_switcher__list__platform__title'>{platform.title}</p>
                        <p className='platform_switcher__list__platform__description'>{platform.description}</p>
                    </div>
                </BinaryLink>
            ))}
        </div>
    </div>
);

PlatformList.propTypes = {
    platform_configs: PropTypes.array,
};

export { PlatformList };
